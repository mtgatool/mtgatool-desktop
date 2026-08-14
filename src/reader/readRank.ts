import {
  CombinedRankInfo,
  rankClass,
} from "../background/onLabel/InEventGetCombinedRankInfo";
import globalStore from "../background/store";
import isElectron from "../utils/electron/isElectron";
import { isValidRankClass } from "../utils/mtga/rankClasses";
import { getReader } from "../utils/mtgaReader";
import timed from "./readerTelemetry";

export default async function readRank(): Promise<
  CombinedRankInfo | undefined
> {
  if (!isElectron()) return undefined;

  try {
    // Reads run on the native threadpool and return a Promise, so they never
    // block this renderer's event loop (the background window also hosts the
    // GRE parser).
    const ranks = await timed("readRanks", () => getReader().readRanks("MTGA"));

    if (!ranks || ranks.error || !ranks.constructed || !ranks.limited) {
      return globalStore.rank || undefined;
    }

    const { constructed: c, limited: l } = ranks;

    // mtga-reader's `class` STRING is one rank behind its own `classValue`:
    // a live read of a Silver player returns { class: "Bronze", classValue: 2 },
    // and Bronze comes back as { class: "Spark", classValue: 1 }. The enum it
    // resolves names against has drifted, so the name is off by one across the
    // board. classValue is correct, so the name is derived from it instead —
    // which is also what the "Spark" guards below were really working around.
    const constructedClass = rankClass[c.classValue];
    const limitedClass = rankClass[l.classValue];

    // A closed/unreadable game can return a zeroed struct with no error flag.
    // Now that the class comes from classValue, an unreadable process shows up
    // as a value outside the enum rather than a junk name.
    if (
      !isValidRankClass(constructedClass) &&
      !isValidRankClass(limitedClass)
    ) {
      return globalStore.rank || undefined;
    }

    globalStore.rank = {
      playerId: ranks.playerId || "",
      constructedSeasonOrdinal: c.seasonOrdinal || 0,
      constructedClass,
      constructedClassValue: c.classValue,
      constructedLevel: c.level || 0,
      constructedStep: c.step || 0,
      constructedMatchesWon: c.wins || 0,
      constructedMatchesLost: c.losses || 0,
      constructedMatchesDrawn: c.draws || 0,
      constructedPercentile: parseFloat(String(c.percentile ?? 0)) || 0,
      constructedLeaderboardPlace: c.leaderboardPlace || 0,
      limitedSeasonOrdinal: l.seasonOrdinal || 0,
      limitedClass,
      limitedClassValue: l.classValue,
      limitedLevel: l.level || 0,
      limitedStep: l.step || 0,
      limitedMatchesWon: l.wins || 0,
      limitedMatchesLost: l.losses || 0,
      limitedMatchesDrawn: l.draws || 0,
      limitedPercentile: parseFloat(String(l.percentile ?? 0)) || 0,
      limitedLeaderboardPlace: l.leaderboardPlace || 0,
    };

    return globalStore.rank;
  } catch (e) {
    console.error("readRank failed:", e);
    return globalStore.rank || undefined;
  }
}
