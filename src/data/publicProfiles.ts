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
