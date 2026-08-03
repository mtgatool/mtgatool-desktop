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
import { CustomBackground } from "../redux/slices/rendererSlice";
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
import { isValidRankClass, sanitizeRank } from "../utils/mtga/rankClasses";
import { ReaderDeck } from "../utils/mtgaReader";
import {
  BackgroundDescriptor,
  loadLocalBackground,
  materialize,
  saveLocalBackground,
} from "./backgroundStore";
import { isCloudActive } from "./cloudSync";
import { getDeletedMatchIds } from "./deletedMatches";
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

    // Matches — add only the ones we don't already have locally, and never
    // resurrect one the user deleted (the remote delete may still be pending,
    // or have happened on another device).
    const deletedMatches = await getDeletedMatchIds();
    await Promise.all(
      (matches.data ?? []).map(async (r) => {
        if (deletedMatches.has(r.match_id)) return;
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
        // Don't pull a bogus cloud rank ("Spark" pushed before the read guard
        // existed) over a good local one — skip it entirely.
        if (!isValidRankClass(c.class) && !isValidRankClass(l.class)) {
          return Promise.resolve();
        }
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
        return writeIfNewer(`${r.arena_id}-rank`, updated, sanitizeRank(rank));
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

    // Profile (one per login): avatar + display name -> local KV, so
    // useFetchAvatar / useFetchUsername show them on this device too (a fresh
    // device or reinstall restores them). profiles is the source of truth.
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) {
        const prof = await supabase
          .from("profiles")
          .select("avatar_url, username, background")
          .eq("id", uid)
          .maybeSingle();
        if (prof.data?.avatar_url) {
          await putData("avatar", prof.data.avatar_url, true);
        }
        if (prof.data?.username) {
          await putData("username", prof.data.username, true);
        }

        // Background: only override the locally-restored one if the account has
        // a *different* artofmtg pick saved. Re-materialize its image (the cloud
        // stores only a compact descriptor, no data URI).
        const desc = prof.data?.background as BackgroundDescriptor | null;
        if (desc?.source === "artofmtg" && desc.imageUrl) {
          const local = await loadLocalBackground();
          const same =
            local?.source === "artofmtg" && local.imageUrl === desc.imageUrl;
          if (!same) {
            const full: CustomBackground | null = await materialize(desc);
            if (full) await saveLocalBackground(full);
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[hydrateFromCloud] profile:", e);
    }
  } catch (e) {
    console.error("[hydrateFromCloud] threw:", e);
  }
}
