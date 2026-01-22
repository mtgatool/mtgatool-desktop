import {
  CombinedRankInfo,
  rankClass,
} from "../background/onLabel/InEventGetCombinedRankInfo";
import globalStore from "../background/store";
import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";

interface _ReturnedRankInfo {
  constructedClass: number;
  constructedLeaderboardPlace: number;
  constructedLevel: number;
  constructedMatchesDrawn: number;
  constructedMatchesLost: number;
  constructedMatchesWon: number;
  constructedPercentile: number;
  constructedSeasonOrdinal: number;
  constructedStep: number;
  limitedClass: number;
  limitedLeaderboardPlace: number;
  limitedLevel: number;
  limitedMatchesDrawn: number;
  limitedMatchesLost: number;
  limitedMatchesWon: number;
  limitedPercentile: number;
  limitedSeasonOrdinal: number;
  limitedStep: number;
  playerId: string;
}

export default async function readRank(): Promise<
  CombinedRankInfo | undefined
> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) {
    return globalStore.rank || undefined;
  }

  const rank = await readData("MTGA", [
    "WrapperController",
    "<Instance>k__BackingField",
    "<PlayerRankServiceWrapper>k__BackingField",
    "_combinedRankInfo",
  ]);

  if (!rank || rank.error || Object.keys(rank).length === 0) {
    if (globalStore.rank) return globalStore.rank;

    return undefined;
  }

  globalStore.rank = {
    ...rank,
    constructedClass: rankClass[rank.constructedClass],
    limitedClass: rankClass[rank.limitedClass],
    constructedClassValue: rank.constructedClass,
    limitedClassValue: rank.limitedClass,
  };

  return globalStore.rank;
}
