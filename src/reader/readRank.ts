import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import globalStore from "../background/store";
import {
  isMemoryReadingAvailable,
  ReaderRank,
  readRanks,
} from "../utils/mtgaReader";

export default async function readRank(): Promise<
  CombinedRankInfo | undefined
> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) {
    return globalStore.rank || undefined;
  }

  const ranks = await readRanks("MTGA");

  if (!ranks || !ranks.constructed || !ranks.limited) {
    if (globalStore.rank) return globalStore.rank;

    return undefined;
  }

  const flatten = (prefix: "constructed" | "limited", rank: ReaderRank) => ({
    [`${prefix}SeasonOrdinal`]: rank.seasonOrdinal ?? 0,
    // The app's rank icons/filters use "Unranked" where the game uses "None"
    [`${prefix}Class`]: rank.class === "None" ? "Unranked" : rank.class,
    [`${prefix}ClassValue`]: rank.classValue,
    [`${prefix}Level`]: rank.level ?? 0,
    [`${prefix}Step`]: rank.step ?? 0,
    [`${prefix}MatchesWon`]: rank.wins ?? 0,
    [`${prefix}MatchesLost`]: rank.losses ?? 0,
    [`${prefix}MatchesDrawn`]: rank.draws ?? 0,
    [`${prefix}Percentile`]: parseFloat(rank.percentile || "0") || 0,
    [`${prefix}LeaderboardPlace`]: rank.leaderboardPlace ?? 0,
  });

  globalStore.rank = {
    playerId: ranks.playerId || "",
    ...flatten("constructed", ranks.constructed),
    ...flatten("limited", ranks.limited),
  } as unknown as CombinedRankInfo;

  return globalStore.rank;
}
