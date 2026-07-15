/**
 * Supabase → client hydrate (pull layer), the mirror of cloudSync's push.
 *
 * On login this pulls every table the user owns (RLS scopes them to
 * auth.uid()) and writes it into the local KV store, so a fresh device — or one
 * that was offline — restores its matches, decks, collection, inventory and
 * ranks. It only *fills gaps*: state tables are written when the cloud copy is
 * newer than (or the local copy is absent), and matches are added only when
 * missing, so live local reads are never clobbered by staler cloud data.
 *
 * It writes KV only; the existing localLogin() then mirrors KV into Redux.
 * No-op offline, and never throws (best-effort, like the push layer).
 */
import { Cards, InternalMatch } from "../types";
import {
  DbCardsData,
  DbDisplayName,
  DbInventoryData,
  DbInventoryInfo,
  DbMatch,
  DbRankData,
  DbUserids,
  defaultRankData,
} from "../types/dbTypes";
import { ReaderDeck } from "../utils/mtgaReader";
import { isCloudActive } from "./cloudSync";
import { getData, putData } from "./store";
import supabase from "./supabase";
import { DbDecksData } from "./upsertDbDecks";

function ms(iso?: string | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Write a `{ updated }` record only if the cloud copy is newer than local. */
async function writeIfNewer(
  key: string,
  updated: number,
  value: unknown
): Promise<void> {
  const existing = await getData<{ updated?: number }>(key, true);
  if (
    existing &&
    typeof existing.updated === "number" &&
    existing.updated >= updated
  ) {
    return;
  }
  await putData(key, value, true);
}

export default async function hydrateFromCloud(): Promise<void> {
  try {
    if (!(await isCloudActive())) return;

    // Fire all reads concurrently but await individually — a 6-way typed
    // Promise.all overflows the supabase type inference (TS2589).
    const accountsP = supabase.from("arena_accounts").select("*");
    const matchesP = supabase.from("matches").select("*");
    const collectionP = supabase.from("arena_collection").select("*");
    const inventoryP = supabase.from("arena_inventory").select("*");
    const ranksP = supabase.from("arena_ranks").select("*");
    const decksP = supabase.from("decks").select("*");

    const accounts = await accountsP;
    const matches = await matchesP;
    const collection = await collectionP;
    const inventory = await inventoryP;
    const ranks = await ranksP;
    const decks = await decksP;

    // Arena personas -> userids map (merged with local) + display names.
    const userids: DbUserids =
      (await getData<DbUserids>("userids", true)) || {};
    await Promise.all(
      (accounts.data ?? []).map((a) => {
        const t = ms(a.last_seen_at);
        userids[a.arena_id] = Math.max(userids[a.arena_id] || 0, t);
        if (!a.display_name) return Promise.resolve();
        const dn: DbDisplayName = { displayName: a.display_name, updated: t };
        return writeIfNewer(`${a.arena_id}-displayname`, t, dn);
      })
    );

    // Matches — add only the ones we don't already have locally.
    await Promise.all(
      (matches.data ?? []).map(async (r) => {
        const key = `matches-${r.match_id}`;
        if (await getData<DbMatch>(key, true)) return;
        const dbMatch: DbMatch = {
          matchId: r.match_id,
          playerId: r.arena_id,
          playerDeckId: r.player_deck_id ?? "",
          playerDeckHash: r.player_deck_hash ?? "",
          playerDeckColors: r.player_deck_colors ?? 0,
          oppDeckColors: r.opp_deck_colors ?? 0,
          playerName: r.player_name ?? "",
          playerWins: r.player_wins ?? 0,
          playerLosses: r.player_losses ?? 0,
          eventId: r.event_id ?? "",
          duration: r.duration ?? 0,
          internalMatch: r.internal_match as unknown as InternalMatch,
          timestamp: ms(r.played_at) || ms(r.created_at),
          pubKey: "",
        };
        await putData(key, dbMatch, true);
        if (!userids[r.arena_id]) userids[r.arena_id] = ms(r.played_at);
      })
    );

    // Collection.
    await Promise.all(
      (collection.data ?? []).map((r) => {
        const updated = ms(r.updated_at);
        const data: DbCardsData = {
          cards: r.cards as unknown as Cards,
          prevCards: (r.prev_cards as unknown as Cards) || ({} as Cards),
          updated,
        };
        return writeIfNewer(`${r.arena_id}-cards`, updated, data);
      })
    );

    // Inventory (the full DbInventoryInfo lives in the `data` jsonb).
    await Promise.all(
      (inventory.data ?? []).map((r) => {
        const updated = ms(r.updated_at);
        const data: DbInventoryData = {
          ...((r.data as unknown as DbInventoryInfo) ||
            ({} as DbInventoryInfo)),
          updated,
        };
        return writeIfNewer(`${r.arena_id}-inventory`, updated, data);
      })
    );

    // Ranks — rebuild the flat CombinedRankInfo from the two jsonb columns.
    await Promise.all(
      (ranks.data ?? []).map((r) => {
        const updated = ms(r.updated_at);
        const c = (r.constructed as Record<string, any>) || {};
        const l = (r.limited as Record<string, any>) || {};
        const rank: DbRankData = {
          ...defaultRankData,
          constructedSeasonOrdinal: c.seasonOrdinal ?? 0,
          constructedClass: c.class ?? "Unranked",
          constructedLevel: c.level ?? 0,
          constructedStep: c.step ?? 0,
          constructedMatchesWon: c.matchesWon ?? 0,
          constructedMatchesLost: c.matchesLost ?? 0,
          constructedMatchesDrawn: c.matchesDrawn ?? 0,
          constructedPercentile: c.percentile ?? 0,
          constructedLeaderboardPlace: c.leaderboardPlace ?? 0,
          limitedSeasonOrdinal: l.seasonOrdinal ?? 0,
          limitedClass: l.class ?? "Unranked",
          limitedLevel: l.level ?? 0,
          limitedStep: l.step ?? 0,
          limitedMatchesWon: l.matchesWon ?? 0,
          limitedMatchesLost: l.matchesLost ?? 0,
          limitedMatchesDrawn: l.matchesDrawn ?? 0,
          limitedPercentile: l.percentile ?? 0,
          limitedLeaderboardPlace: l.leaderboardPlace ?? 0,
          updated,
        };
        return writeIfNewer(`${r.arena_id}-rank`, updated, rank);
      })
    );

    // Decks — grouped back into one `${arena}-decks` record per persona.
    const decksByArena = new Map<
      string,
      { decks: ReaderDeck[]; updated: number }
    >();
    (decks.data ?? []).forEach((r) => {
      const g = decksByArena.get(r.arena_id) || { decks: [], updated: 0 };
      g.decks.push(r.deck as unknown as ReaderDeck);
      g.updated = Math.max(g.updated, ms(r.updated_at));
      decksByArena.set(r.arena_id, g);
    });
    await Promise.all(
      [...decksByArena.entries()].map(([arenaId, g]) => {
        const data: DbDecksData = { decks: g.decks, updated: g.updated };
        return writeIfNewer(`${arenaId}-decks`, g.updated, data);
      })
    );

    // Persist the merged userids last so localLogin picks up every persona.
    await putData("userids", userids, true);
  } catch (e) {
    console.error("[hydrateFromCloud] threw:", e);
  }
}
