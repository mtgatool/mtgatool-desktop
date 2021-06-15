import { draftStateObject } from "./currentDraftStore";
import { matchStateObject } from "./currentMatchStore";

// Use this store only when redux struggles with the data (too complex, too deep)
// Or when there is not need to use the redux/react selector wizardy.
const globalStore = {
  currentMatch: matchStateObject,
  currentDraft: draftStateObject,
  currentActionLog: "",
  rank: {
    constructed: {
      rank: "",
      tier: 0,
      step: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      percentile: 0,
      leaderboardPlace: 0,
      seasonOrdinal: 0,
    },
    limited: {
      rank: "",
      tier: 0,
      step: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      percentile: 0,
      leaderboardPlace: 0,
      seasonOrdinal: 0,
    },
  },
};

window.globalStore = globalStore;

export default globalStore;
