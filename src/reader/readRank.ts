import isElectron from "../utils/electron/isElectron";

interface CombinedRankInfo {
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

export default function readRank(): CombinedRankInfo | undefined {
  if (!isElectron()) return undefined;

  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const { readData } = reader;

  const rank = readData("MTGA", [
    "WrapperController",
    "<Instance>k__BackingField",
    "<PlayerRankServiceWrapper>k__BackingField",
    "_combinedRankInfo",
  ]);

  if (rank.error) return undefined;

  if (Object.keys(rank).length === 0) return undefined;

  return rank;
}
