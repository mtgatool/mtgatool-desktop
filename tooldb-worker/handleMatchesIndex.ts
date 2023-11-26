/* eslint-disable no-restricted-globals */
import { getMatchesData } from "./getMatchesData";
import reduxAction from "./reduxAction";

export default function handleMatchesIndex(matchesIds: string[] | null) {
  if (matchesIds) {
    reduxAction("SET_REMOTE_MATCHES_INDEX", matchesIds);

    getMatchesData(
      "MATCHES_DATA",
      matchesIds,
      self.globalData.currentUUID,
      (total, saved) => {
        reduxAction("SET_MATCHES_FETCH_STATE", {
          total,
          saved,
        });
      }
    );
  }
}
