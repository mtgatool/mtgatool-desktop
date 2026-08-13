/**
 * Client → Supabase sync (push layer).
 *
 * Every local write (matches, collection, decks, inventory, ranks) also pushes
 * to Supabase when a cloud account is logged in. Data is partitioned by
 * `(user_id = auth.uid(), arena_id = personaId)`; RLS enforces ownership.
 *
 * All functions are no-ops when there is no cloud session (local/offline mode)
 * and never throw — they are fire-and-forget from the local writers, so a
 * network failure must not break local persistence.
 *
 * `arena_accounts` is the FK parent of every data table, so it is upserted
 * first (`upsertArenaAccount`) before any dependent row.
 */
import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { Cards, InternalDraftv2 } from "../types";
import { DbInventoryInfo, DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import { ReaderDeck } from "../utils/mtgaReader";
import { FormatsSnapshot } from "../utils/normalizeFormats";
import setLocalSetting from "../utils/setLocalSetting";
import { Database, Json } from "./database.types";
import supabase from "./supabase";

type Tables = Database["public"]["Tables"];

const asJson = (v: unknown): Json => v as unknown as Json;

// State tables (collection/inventory/ranks/decks) are re-read on every scene
// change, but rarely actually change. Skip a push when the payload is identical
// to the last one we sent this session, so the full collection (~25k cards)
// isn't re-uploaded on every read. Keyed by `table:arenaId`.
const lastFingerprint = new Map<string, string>();
function unchangedSinceLastPush(key: string, fingerprint: string): boolean {
  if (lastFingerprint.get(key) === fingerprint) return true;
  lastFingerprint.set(key, fingerprint);
  return false;
}

// Cheap fingerprint for a card collection: distinct-card count + total count.
// Avoids stringifying the whole ~25k-entry map just to detect a no-op.
function collectionFingerprint(cards: Cards): string {
  const map = cards as unknown as Record<string, number>;
  const keys = Object.keys(map);
  let total = 0;
  keys.forEach((k) => {
    total += map[k] || 0;
  });
  return `${keys.length}:${total}`;
}

/** The logged-in cloud user's id, or null in local/offline mode. */
export async function getActiveUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** True when a cloud account is logged in (vs. local/offline). */
export async function isCloudActive(): Promise<boolean> {
  return (await getActiveUserId()) !== null;
}

/**
 * The set of match ids already stored in Supabase for the current user (across
 * all their linked arena accounts — match_id is unique per user). Used to
 * reconcile the local match history against the cloud (which matches still
 * need pushing) and to drive the per-match "synced" indicator. Empty when
 * offline or on error.
 */
export async function fetchRemoteMatchIds(): Promise<Set<string>> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return new Set();
    const { data, error } = await supabase.from("matches").select("match_id");
    if (error) {
      console.error("[cloudSync] fetchRemoteMatchIds:", error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => r.match_id));
  } catch (e) {
    console.error("[cloudSync] fetchRemoteMatchIds threw:", e);
    return new Set();
  }
}

async function upsertArenaAccount(
  userId: string,
  arenaId: string,
  displayName?: string
): Promise<boolean> {
  // "default" is the local placeholder used before MTGA's authenticateResponse
  // has been parsed — it is not an Arena account, and 60 logins once claimed
  // it in the cloud. Every push funnels through here, so this is the one
  // gate: the placeholder stays local, its data uploads once the real
  // playerId is known.
  if (!arenaId || arenaId === "default") return false;
  const row: Tables["arena_accounts"]["Insert"] = {
    user_id: userId,
    arena_id: arenaId,
    last_seen_at: new Date().toISOString(),
  };
  if (displayName) row.display_name = displayName;
  const { error } = await supabase
    .from("arena_accounts")
    .upsert(row, { onConflict: "user_id,arena_id" });
  if (error) console.error("[cloudSync] arena_accounts:", error.message);
  return !error;
}

/** Link (or refresh) an MTGA account under the current cloud user. */
export async function ensureArenaAccount(
  arenaId: string,
  displayName?: string
): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId) return false;
    return await upsertArenaAccount(userId, arenaId, displayName);
  } catch (e) {
    console.error("[cloudSync] ensureArenaAccount threw:", e);
    return false;
  }
}

/** Returns true when the match is confirmed stored in Supabase. */
export async function pushMatch(arenaId: string, m: DbMatch): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId || !m?.matchId) return false;
    if (!(await upsertArenaAccount(userId, arenaId))) return false;

    const row: Tables["matches"]["Insert"] = {
      user_id: userId,
      arena_id: arenaId,
      match_id: m.matchId,
      event_id: m.eventId ?? null,
      played_at: m.timestamp ? new Date(m.timestamp).toISOString() : null,
      player_name: m.playerName ?? null,
      player_deck_id: m.playerDeckId ?? null,
      player_deck_hash: m.playerDeckHash ?? null,
      player_deck_colors: m.playerDeckColors ?? null,
      opp_deck_colors: m.oppDeckColors ?? null,
      player_wins: m.playerWins ?? null,
      player_losses: m.playerLosses ?? null,
      duration: m.duration ?? null,
      internal_match: asJson(m.internalMatch),
    };
    const { error } = await supabase
      .from("matches")
      .upsert(row, { onConflict: "user_id,match_id" });
    if (error) {
      console.error("[cloudSync] pushMatch:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] pushMatch threw:", e);
    return false;
  }
}

/**
 * Upload a normalized GetFormats snapshot, versioned by content hash. One row
 * is one account ATTESTING to one snapshot — mtgatool-metadata only adopts a
 * table once enough distinct accounts have uploaded the same hash, so each
 * row carries this account's own copy of the content for the consumer to
 * verify against the hash. A localSetting remembers the last hash this
 * client uploaded so ordinary boots never touch the network.
 */
export async function pushFormatsSnapshot(
  snapshot: FormatsSnapshot
): Promise<boolean> {
  try {
    const json = JSON.stringify(snapshot);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(json)
    );
    const hash = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (getLocalSetting("formatsSnapshotHash") === hash) return true;

    const userId = await getActiveUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from("formats_snapshots")
      .upsert(
        { hash, formats: asJson(snapshot) },
        { onConflict: "hash,uploaded_by", ignoreDuplicates: true }
      );
    if (error) {
      console.error("[cloudSync] pushFormatsSnapshot:", error.message);
      return false;
    }
    setLocalSetting("formatsSnapshotHash", hash);
    return true;
  } catch (e) {
    console.error("[cloudSync] pushFormatsSnapshot threw:", e);
    return false;
  }
}

/** Mirror a finished draft to Supabase. Same contract as pushMatch. */
export async function pushDraft(
  arenaId: string,
  draft: InternalDraftv2
): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId || !draft?.id) return false;
    if (!(await upsertArenaAccount(userId, arenaId))) return false;

    const row: Tables["drafts"]["Insert"] = {
      user_id: userId,
      arena_id: arenaId,
      draft_id: draft.id,
      event_id: draft.eventId || null,
      draft_set: draft.draftSet || null,
      played_at: draft.date ? new Date(draft.date).toISOString() : null,
      deck_id: draft.deckId ?? null,
      internal_draft: asJson(draft),
    };
    const { error } = await supabase
      .from("drafts")
      .upsert(row, { onConflict: "user_id,draft_id" });
    if (error) {
      console.error("[cloudSync] pushDraft:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] pushDraft threw:", e);
    return false;
  }
}

/**
 * Remove a match from Supabase. RLS already scopes `matches` to auth.uid(), so
 * matching on match_id alone can only ever hit the current user's own row.
 * Returns true when the row is gone (including when there was nothing to
 * delete); false when offline or the delete failed, so the caller can retry.
 */
export async function deleteRemoteMatch(matchId: string): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !matchId) return false;
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("user_id", userId)
      .eq("match_id", matchId);
    if (error) {
      console.error("[cloudSync] deleteRemoteMatch:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] deleteRemoteMatch threw:", e);
    return false;
  }
}

/**
 * Record that a match was deleted, so every other device learns about it.
 * Without this the tombstone stays local and any device still holding the
 * match re-pushes it on its next sync — see the deleted_matches migration.
 */
export async function pushDeletedMatch(matchId: string): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !matchId) return false;
    const { error } = await supabase
      .from("deleted_matches")
      .upsert(
        { user_id: userId, match_id: matchId },
        { onConflict: "user_id,match_id" }
      );
    if (error) {
      console.error("[cloudSync] pushDeletedMatch:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] pushDeletedMatch threw:", e);
    return false;
  }
}

/**
 * Remove a draft from Supabase. RLS scopes `drafts` to auth.uid(), so matching
 * on draft_id alone can only hit the current user's own row.
 */
export async function deleteRemoteDraft(draftId: string): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !draftId) return false;
    const { error } = await supabase
      .from("drafts")
      .delete()
      .eq("draft_id", draftId);
    if (error) {
      console.error("[cloudSync] deleteRemoteDraft:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] deleteRemoteDraft threw:", e);
    return false;
  }
}

/** Record a draft deletion for other devices — same contract as pushDeletedMatch. */
export async function pushDeletedDraft(draftId: string): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !draftId) return false;
    const { error } = await supabase
      .from("deleted_drafts")
      .upsert(
        { user_id: userId, draft_id: draftId },
        { onConflict: "user_id,draft_id" }
      );
    if (error) {
      console.error("[cloudSync] pushDeletedDraft:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cloudSync] pushDeletedDraft threw:", e);
    return false;
  }
}

/** Draft ids this account has deleted anywhere. Empty offline or on error. */
export async function fetchDeletedDraftIds(): Promise<Set<string>> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return new Set();
    const { data, error } = await supabase
      .from("deleted_drafts")
      .select("draft_id");
    if (error) {
      console.error("[cloudSync] fetchDeletedDraftIds:", error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => r.draft_id));
  } catch (e) {
    console.error("[cloudSync] fetchDeletedDraftIds threw:", e);
    return new Set();
  }
}

/** Match ids this account has deleted anywhere. Empty offline or on error. */
export async function fetchDeletedMatchIds(): Promise<Set<string>> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return new Set();
    const { data, error } = await supabase
      .from("deleted_matches")
      .select("match_id");
    if (error) {
      console.error("[cloudSync] fetchDeletedMatchIds:", error.message);
      return new Set();
    }
    return new Set((data ?? []).map((r) => r.match_id));
  } catch (e) {
    console.error("[cloudSync] fetchDeletedMatchIds threw:", e);
    return new Set();
  }
}

export async function pushCollection(
  arenaId: string,
  cards: Cards,
  prevCards?: Cards
): Promise<void> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId) return;
    if (
      unchangedSinceLastPush(
        `collection:${arenaId}`,
        collectionFingerprint(cards)
      )
    )
      return;
    if (!(await upsertArenaAccount(userId, arenaId))) return;

    const row: Tables["arena_collection"]["Insert"] = {
      user_id: userId,
      arena_id: arenaId,
      cards: asJson(cards),
      updated_at: new Date().toISOString(),
    };
    if (prevCards) row.prev_cards = asJson(prevCards);
    const { error } = await supabase
      .from("arena_collection")
      .upsert(row, { onConflict: "user_id,arena_id" });
    if (error) console.error("[cloudSync] pushCollection:", error.message);
  } catch (e) {
    console.error("[cloudSync] pushCollection threw:", e);
  }
}

export async function pushDecks(
  arenaId: string,
  decks: ReaderDeck[]
): Promise<void> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId || !decks?.length) return;
    if (unchangedSinceLastPush(`decks:${arenaId}`, JSON.stringify(decks)))
      return;
    if (!(await upsertArenaAccount(userId, arenaId))) return;

    const now = new Date().toISOString();
    const rows: Tables["decks"]["Insert"][] = decks
      .filter((d) => d && d.deckId)
      .map((d) => ({
        user_id: userId,
        arena_id: arenaId,
        deck_id: String(d.deckId),
        name: d.name ?? null,
        deck: asJson(d),
        updated_at: now,
      }));
    if (!rows.length) return;
    const { error } = await supabase
      .from("decks")
      .upsert(rows, { onConflict: "user_id,deck_id" });
    if (error) console.error("[cloudSync] pushDecks:", error.message);
  } catch (e) {
    console.error("[cloudSync] pushDecks threw:", e);
  }
}

export async function pushInventory(
  arenaId: string,
  inv: Partial<DbInventoryInfo>
): Promise<void> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId || !inv) return;
    if (unchangedSinceLastPush(`inventory:${arenaId}`, JSON.stringify(inv)))
      return;
    if (!(await upsertArenaAccount(userId, arenaId))) return;

    const row: Tables["arena_inventory"]["Insert"] = {
      user_id: userId,
      arena_id: arenaId,
      gems: inv.Gems ?? null,
      gold: inv.Gold ?? null,
      total_vault_progress: inv.TotalVaultProgress ?? null,
      wc_track_position: inv.wcTrackPosition ?? null,
      wc_common: inv.WildCardCommons ?? null,
      wc_uncommon: inv.WildCardUnCommons ?? null,
      wc_rare: inv.WildCardRares ?? null,
      wc_mythic: inv.WildCardMythics ?? null,
      data: asJson(inv),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("arena_inventory")
      .upsert(row, { onConflict: "user_id,arena_id" });
    if (error) console.error("[cloudSync] pushInventory:", error.message);
  } catch (e) {
    console.error("[cloudSync] pushInventory threw:", e);
  }
}

export async function pushRanks(
  arenaId: string,
  rank: Partial<CombinedRankInfo>
): Promise<void> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !arenaId || !rank) return;
    if (unchangedSinceLastPush(`ranks:${arenaId}`, JSON.stringify(rank)))
      return;
    if (!(await upsertArenaAccount(userId, arenaId))) return;

    // CombinedRankInfo is flat (constructed*/limited*); split into the two
    // jsonb columns.
    const r = rank as CombinedRankInfo;
    const constructed = {
      seasonOrdinal: r.constructedSeasonOrdinal,
      class: r.constructedClass,
      level: r.constructedLevel,
      step: r.constructedStep,
      matchesWon: r.constructedMatchesWon,
      matchesLost: r.constructedMatchesLost,
      matchesDrawn: r.constructedMatchesDrawn,
      percentile: r.constructedPercentile,
      leaderboardPlace: r.constructedLeaderboardPlace,
    };
    const limited = {
      seasonOrdinal: r.limitedSeasonOrdinal,
      class: r.limitedClass,
      level: r.limitedLevel,
      step: r.limitedStep,
      matchesWon: r.limitedMatchesWon,
      matchesLost: r.limitedMatchesLost,
      matchesDrawn: r.limitedMatchesDrawn,
      percentile: r.limitedPercentile,
      leaderboardPlace: r.limitedLeaderboardPlace,
    };
    const row: Tables["arena_ranks"]["Insert"] = {
      user_id: userId,
      arena_id: arenaId,
      constructed: asJson(constructed),
      limited: asJson(limited),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("arena_ranks")
      .upsert(row, { onConflict: "user_id,arena_id" });
    if (error) console.error("[cloudSync] pushRanks:", error.message);
  } catch (e) {
    console.error("[cloudSync] pushRanks threw:", e);
  }
}
