import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import globalStore from "../background/store";
import isElectron from "../utils/electron/isElectron";
import { ReaderRanks } from "../utils/mtgaReader";
import { isValidRankClass } from "../utils/mtga/rankClasses";

export default function readRank(): CombinedRankInfo | undefined {
  if (!isElectron()) return undefined;

  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  // mtga-reader 0.1.6 typed rank read returns a nested shape:
  // { playerId, constructed: {...}, limited: {...} } where `class` is already
  // the rank-name string. Flatten it back into the app's CombinedRankInfo.
  const ranks: ReaderRanks & { error?: string } = reader.readRanks("MTGA");

  if (!ranks || ranks.error || !ranks.constructed || !ranks.limited) {
    return globalStore.rank || undefined;
  }

  const { constructed: c, limited: l } = ranks;

  // A closed/unreadable game can return a zeroed struct with no error flag
  // (class comes back as e.g. "Spark"). Reject it so we never clobber a good
  // stored rank — keep whatever we last read instead.
  if (!isValidRankClass(c.class) && !isValidRankClass(l.class)) {
    return globalStore.rank || undefined;
  }

  globalStore.rank = {
    playerId: ranks.playerId || "",
    constructedSeasonOrdinal: c.seasonOrdinal || 0,
    constructedClass: c.class,
    constructedClassValue: c.classValue,
    constructedLevel: c.level || 0,
    constructedStep: c.step || 0,
    constructedMatchesWon: c.wins || 0,
    constructedMatchesLost: c.losses || 0,
    constructedMatchesDrawn: c.draws || 0,
    constructedPercentile: parseFloat(c.percentile || "0") || 0,
    constructedLeaderboardPlace: c.leaderboardPlace || 0,
    limitedSeasonOrdinal: l.seasonOrdinal || 0,
    limitedClass: l.class,
    limitedClassValue: l.classValue,
    limitedLevel: l.level || 0,
    limitedStep: l.step || 0,
    limitedMatchesWon: l.wins || 0,
    limitedMatchesLost: l.losses || 0,
    limitedMatchesDrawn: l.draws || 0,
    limitedPercentile: parseFloat(l.percentile || "0") || 0,
    limitedLeaderboardPlace: l.leaderboardPlace || 0,
  };

  return globalStore.rank;
}
