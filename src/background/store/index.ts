import { CombinedRankInfo } from "../onLabel/InEventGetCombinedRankInfo";
import { Course } from "../onLabel/InEventGetCourses";
import { draftStateObject } from "./currentDraftStore";
import { matchStateObject } from "./currentMatchStore";

// Use this store only when redux struggles with the data (too complex, too deep)
// Or when there is not need to use the redux/react selector wizardy.
const globalStore = {
  currentMatch: matchStateObject,
  currentDraft: draftStateObject,
  currentActionLog: "",
  currentCourses: {} as Record<string, Course>,
  rank: {
    constructedSeasonOrdinal: 0,
    constructedClass: "Begginer",
    constructedLevel: 0,
    constructedStep: 0,
    constructedMatchesWon: 0,
    constructedMatchesLost: 0,
    constructedMatchesDrawn: 0,
    limitedSeasonOrdinal: 0,
    limitedClass: "Begginer",
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
