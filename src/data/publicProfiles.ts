/**
 * Public cross-user lookups (showcase). Both go through security-definer RPCs
 * that read past the per-user RLS but expose only public fields and exclude
 * users who have private mode on.
 *
 * - getLatestRanks: recent ranks across users for the Home feed.
 * - getPublicProfiles: resolve display name + avatar for a set of arena
 *   personas (e.g. the current opponent).
 */
import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import DbRankInfo from "../components/views/home/DbRankInfo";
import { defaultRankData } from "../types/dbTypes";
import supabase from "./supabase";

function ms(iso?: string | null): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

function flatten(
  c: Record<string, any>,
  l: Record<string, any>
): CombinedRankInfo {
  return {
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
  };
}

/** Recent ranks across users, shaped for the Home feed. */
export async function getLatestRanks(limit = 100): Promise<DbRankInfo[]> {
  try {
    const { data, error } = await supabase.rpc("get_latest_ranks", {
      p_limit: limit,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[ranks] getLatestRanks failed:", error.message);
      return [];
    }
    return (data ?? []).map((r) => ({
      ...flatten(
        (r.constructed as Record<string, any>) || {},
        (r.limited as Record<string, any>) || {}
      ),
      uuid: r.arena_id,
      pubKey: r.arena_id,
      name: r.username || r.display_name || "",
      avatar: r.avatar_url || "",
      updated: ms(r.updated_at),
    }));
  } catch {
    return [];
  }
}

export interface PublicProfile {
  name: string;
  avatar: string;
}

/** Resolve public display name + avatar for arena personas, keyed by arena_id. */
export async function getPublicProfiles(
  arenaIds: string[]
): Promise<Record<string, PublicProfile>> {
  const out: Record<string, PublicProfile> = {};
  const ids = arenaIds.filter(Boolean);
  if (ids.length === 0) return out;
  try {
    const { data, error } = await supabase.rpc("get_public_profiles", {
      p_arena_ids: ids,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[profiles] getPublicProfiles failed:", error.message);
      return out;
    }
    (data ?? []).forEach((r) => {
      out[r.arena_id] = {
        name: r.username || r.display_name || "",
        avatar: r.avatar_url || "",
      };
    });
    return out;
  } catch {
    return out;
  }
}

// Field names below come from the RPC's jsonb, hence the database spelling.
/* eslint-disable camelcase */

/** One rank side as stored in arena_ranks jsonb. */
export interface ProfileRankSide {
  class?: string;
  level?: number;
  step?: number;
  percentile?: number;
  leaderboardPlace?: number;
  matchesWon?: number;
  matchesLost?: number;
  seasonOrdinal?: number;
}

/**
 * The single Arena account a profile exposes (the owner's pinned one, or the
 * most recently played). Deliberately carries no arena id.
 */
export interface ProfileAccount {
  display_name: string | null;
  constructed: ProfileRankSide | null;
  limited: ProfileRankSide | null;
  ranks_updated_at: string | null;
}

export interface RecentRecord {
  wins: number;
  losses: number;
}

export interface PlayerProfile {
  username: string | null;
  avatar_url: string | null;
  supporter_tier: number;
  background: { imageUrl?: string } | null;
  member_since: string | null;
  /** When the visible account last uploaded anything. */
  last_seen: string | null;
  account: ProfileAccount | null;
  /** Match records over the last 30 days — season totals reset mid-story. */
  recent_30d: { constructed: RecentRecord; limited: RecentRecord } | null;
  /** Matches played per raw event id, for the formats summary. */
  format_counts: Record<string, number>;
}

/** Rank as embedded in a stored match (both players'). */
export interface PublicMatchRank {
  rank: string | null;
  tier: number | null;
  step: number | null;
  percentile: number | null;
  leaderboardPlace: number | null;
}

export interface PlayerMatchRow {
  match_id: string;
  event_id: string;
  played_at: string;
  deck_name: string | null;
  deck_tile_id: number | null;
  /** Main-deck card ids, present only when the deck has no tile of its own. */
  fallback_ids: number[] | null;
  opp_name: string | null;
  player_rank: PublicMatchRank | null;
  opp_rank: PublicMatchRank | null;
  player_deck_colors: number | null;
  opp_deck_colors: number | null;
  player_wins: number;
  player_losses: number;
  duration: number | null;
}

/**
 * The public view of one match: the played deck, the result, the opponent's
 * in-game name and rank, and the action log. No arena ids and no per-game
 * telemetry (hands drawn, cards seen).
 */
export interface PublicMatch {
  match_id: string;
  event_id: string;
  played_at: string;
  duration: number | null;
  best_of: number | null;
  player_wins: number;
  player_losses: number;
  player_deck: {
    name?: string;
    deckTileId?: number;
    mainDeck?: { id: number; quantity: number }[];
    sideboard?: { id: number; quantity: number }[];
  } | null;
  opp_deck_colors: number | null;
  opp_name: string | null;
  /** Plain text for old matches, a structured object for new ones. */
  action_log: string | Record<string, unknown> | null;
  player_rank: PublicMatchRank | null;
  opp_rank: PublicMatchRank | null;
}

/**
 * One aggregated deck from the player's uploaded matches. Versions are
 * unified by Arena deck id; the record spans all of them and `deck` is the
 * latest version's snapshot.
 */
export interface PlayerDeckRow {
  id: string;
  games: number;
  wins: number;
  last_played: string;
  deck: {
    name?: string;
    deckTileId?: number;
    colors?: number;
    mainDeck?: { id: number; quantity: number }[];
    sideboard?: { id: number; quantity: number }[];
  } | null;
}

export interface PlayerDecksPage {
  decks: PlayerDeckRow[];
  full_access: boolean;
}

export interface PlayerMatchesPage {
  matches: PlayerMatchRow[];
  total: number;
  /** Whether the CALLER may page past the first five (Standard+ patron). */
  full_access: boolean;
}

/* eslint-enable camelcase */

/**
 * A player's public profile, by arena persona id or username. Resolves to
 * null for private-mode profiles and unknown players alike — the screen
 * cannot tell the difference, deliberately.
 */
export async function getPlayerProfile(query: {
  arenaId?: string;
  username?: string;
}): Promise<PlayerProfile | null> {
  try {
    const { data, error } = await supabase.rpc("get_player_profile", {
      p_arena_id: query.arenaId,
      p_username: query.username,
    });
    if (error || !data) return null;
    return data as unknown as PlayerProfile;
  } catch {
    return null;
  }
}

/**
 * A page of the player's public match list, for the same account the profile
 * shows. The server caps everyone at the last 5 unless the caller's Patreon
 * entitlement is Standard tier or higher — the limit passed here is a
 * request, not a promise.
 */
export async function getPlayerMatches(
  query: { arenaId?: string; username?: string },
  limit = 5,
  offset = 0,
  deckId?: string
): Promise<PlayerMatchesPage | null> {
  try {
    const { data, error } = await supabase.rpc("get_player_matches", {
      p_arena_id: query.arenaId,
      p_username: query.username,
      p_limit: limit,
      p_offset: offset,
      p_deck_id: deckId,
    });
    if (error || !data) return null;
    return data as unknown as PlayerMatchesPage;
  } catch {
    return null;
  }
}

/**
 * The player's decks with records, aggregated from their uploaded matches.
 * A Standard-tier perk: non-patron callers get an empty list and
 * full_access=false.
 */
export async function getPlayerDecks(query: {
  arenaId?: string;
  username?: string;
}): Promise<PlayerDecksPage | null> {
  try {
    const { data, error } = await supabase.rpc("get_player_decks", {
      p_arena_id: query.arenaId,
      p_username: query.username,
    });
    if (error || !data) return null;
    return data as unknown as PlayerDecksPage;
  } catch {
    return null;
  }
}

/**
 * One match's public view, scoped to the same profile the match list came
 * from. Null for private profiles and unknown ids alike.
 */
export async function getPublicMatch(
  matchId: string,
  query: { arenaId?: string; username?: string }
): Promise<PublicMatch | null> {
  try {
    const { data, error } = await supabase.rpc("get_public_match", {
      p_match_id: matchId,
      p_arena_id: query.arenaId,
      p_username: query.username,
    });
    if (error || !data) return null;
    return data as unknown as PublicMatch;
  } catch {
    return null;
  }
}
