import { ActionLogV2 } from "../../components/action-log-v2/types";
import { CombinedRankInfo } from "../onLabel/InEventGetCombinedRankInfo";
import { Course } from "../onLabel/InEventGetCourses";
import { createDraftState } from "./currentDraftStore";
import { createMatchState } from "./currentMatchStore";

// Use this store only when redux struggles with the data (too complex, too deep)
// Or when there is not need to use the redux/react selector wizardy.
const globalStore = {
  // A fresh state, never the defaults themselves — the setters write straight
  // through this reference, so sharing it would mean the first match edits what
  // every later match resets to.
  currentMatch: createMatchState(),
  currentDraft: createDraftState(),
  currentActionLog: {
    lines: [],
    players: [],
    version: 2,
  } as ActionLogV2,
  currentCourses: {} as Record<string, Course>,
  rank: {
    constructedSeasonOrdinal: 0,
    constructedClass: "Unranked",
    constructedLevel: 0,
    constructedStep: 0,
    constructedMatchesWon: 0,
    constructedMatchesLost: 0,
    constructedMatchesDrawn: 0,
    limitedSeasonOrdinal: 0,
    limitedClass: "Unranked",
    limitedLevel: 0,
    limitedStep: 0,
    limitedMatchesWon: 0,
    limitedMatchesLost: 0,
    limitedMatchesDrawn: 0,
    constructedPercentile: 0,
    constructedLeaderboardPlace: 0,
    limitedPercentile: 0,
    limitedLeaderboardPlace: 0,
  } as CombinedRankInfo,
};

window.globalStore = globalStore;

export default globalStore;
