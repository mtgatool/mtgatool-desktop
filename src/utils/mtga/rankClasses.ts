import { CombinedRankInfo } from "../../background/onLabel/InEventGetCombinedRankInfo";

/**
 * The rank classes we actually track. The memory reader emits MTGA's full
 * RankingClassType enum, which includes non-competitive / placeholder values
 * ("None", "Spark", "Master", "Unknown"). A closed or unreadable game also
 * reads a garbage low value that maps to "Spark". Anything outside this set is
 * treated as "no rank" so it can never overwrite (or roll back) a real rank.
 */
const VALID_RANK_CLASSES = new Set([
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "mythic",
]);

export function isValidRankClass(cls?: string | null): boolean {
  return typeof cls === "string" && VALID_RANK_CLASSES.has(cls.toLowerCase());
}

/**
 * Blank out either queue whose class isn't a real rank, so a bogus read
 * ("Spark") displays as Unranked instead of rolling the player's rank back.
 * Returns a copy; never mutates the input.
 */
export function sanitizeRank<T extends CombinedRankInfo>(rank: T): T {
  const r = { ...rank };
  if (!isValidRankClass(r.constructedClass)) {
    r.constructedClass = "Unranked";
    r.constructedLevel = 0;
    r.constructedStep = 0;
    r.constructedPercentile = 0;
    r.constructedLeaderboardPlace = 0;
  }
  if (!isValidRankClass(r.limitedClass)) {
    r.limitedClass = "Unranked";
    r.limitedLevel = 0;
    r.limitedStep = 0;
    r.limitedPercentile = 0;
    r.limitedLeaderboardPlace = 0;
  }
  return r;
}
