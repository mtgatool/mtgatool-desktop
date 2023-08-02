/* eslint-disable no-restricted-globals */
import reduxAction from "./reduxAction";

export default function handleMatchesIndex(matchesIndex: string[] | null) {
  self.globalData.matchesIndex = [
    ...new Set([...self.globalData.matchesIndex, ...(matchesIndex || [])]),
  ];
  console.log("handleMatchesIndex", self.globalData.matchesIndex);

  // Fetch any match we dont have locally
  self.globalData.matchesIndex.forEach((id: string) => {
    self.toolDb.store.get(id, (err, data) => {
      if (!data) {
        self.toolDb.getData(id, false, 2000);
      }
    });
  });

  reduxAction("SET_MATCHES_INDEX", self.globalData.matchesIndex);
}
