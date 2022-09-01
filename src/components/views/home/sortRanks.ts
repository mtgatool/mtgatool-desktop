import getRankFilterVal, { RANK_MYTHIC } from "../history/getRankFilterVal";
import DbRankInfo from "./DbRankInfo";

export function sortConstructedRanks(a?: DbRankInfo, b?: DbRankInfo) {
  if (!a || !b) return 0;

  const ac = getRankFilterVal(a.constructedClass);
  const bc = getRankFilterVal(b.constructedClass);
  if (ac < bc) return 1;
  if (ac > bc) return -1;

  if (ac !== RANK_MYTHIC) {
    if (a.constructedLevel < b.constructedLevel) return -1;
    if (a.constructedLevel > b.constructedLevel) return 1;

    if (a.constructedStep < b.constructedStep) return 1;
    if (a.constructedStep > b.constructedStep) return -1;
  }

  if (
    a.constructedLeaderboardPlace !== 0 &&
    b.constructedLeaderboardPlace === 0
  )
    return -1;
  if (
    b.constructedLeaderboardPlace !== 0 &&
    a.constructedLeaderboardPlace === 0
  )
    return 1;

  if (a.constructedLeaderboardPlace < b.constructedLeaderboardPlace) return -1;
  if (a.constructedLeaderboardPlace > b.constructedLeaderboardPlace) return 1;

  if (a.constructedPercentile < b.constructedPercentile) return 1;
  if (a.constructedPercentile > b.constructedPercentile) return -1;

  return 0;
}

export function sortLimitedRanks(a?: DbRankInfo, b?: DbRankInfo) {
  if (!a || !b) return 0;

  const ac = getRankFilterVal(a.limitedClass);
  const bc = getRankFilterVal(b.limitedClass);
  if (ac < bc) return 1;
  if (ac > bc) return -1;

  if (ac !== RANK_MYTHIC) {
    if (a.limitedLevel < b.limitedLevel) return -1;
    if (a.limitedLevel > b.limitedLevel) return 1;

    if (a.limitedStep < b.limitedStep) return 1;
    if (a.limitedStep > b.limitedStep) return -1;
  }

  if (a.limitedLeaderboardPlace !== 0 && b.limitedLeaderboardPlace === 0)
    return -1;
  if (b.limitedLeaderboardPlace !== 0 && a.limitedLeaderboardPlace === 0)
    return 1;

  if (a.limitedLeaderboardPlace < b.limitedLeaderboardPlace) return -1;
  if (a.limitedLeaderboardPlace > b.limitedLeaderboardPlace) return 1;

  if (a.limitedPercentile < b.limitedPercentile) return 1;
  if (a.limitedPercentile > b.limitedPercentile) return -1;

  return 0;
}
