/* eslint-disable no-restricted-globals */
import getMatchesData from "./getMatchesData";
import reduxAction from "./reduxAction";

export default function handleMatchesIndex(matchesIndex: string[] | null) {
  self.globalData.matchesIndex = [
    ...new Set([...self.globalData.matchesIndex, ...(matchesIndex || [])]),
  ];

  let saved = 0;
  let timeout: NodeJS.Timeout | null = null;
  let lastUpdate = new Date().getTime();

  function updateState() {
    timeout = null;
    reduxAction("SET_MATCHES_FETCH_STATE", {
      total: self.globalData.matchesIndex.length,
      saved,
    });

    if (saved === self.globalData.matchesIndex.length) {
      reduxAction("SET_MATCHES_INDEX", self.globalData.matchesIndex);

      getMatchesData(self.globalData.matchesIndex, self.globalData.currentUUID);
    }
  }

  function debounceUpdateState() {
    if (timeout) clearTimeout(timeout);
    if (new Date().getTime() - lastUpdate > 1000) {
      lastUpdate = new Date().getTime();
      updateState();
    }
    timeout = setTimeout(updateState, 100);
  }

  // Fetch any match we dont have locally
  self.globalData.matchesIndex.forEach((id: string) => {
    self.toolDb.store.get(id, (err) => {
      if (!err) {
        saved += 1;
        debounceUpdateState();
      } else {
        self.toolDb.getData(id, false, 2000).finally(() => {
          saved += 1;
          debounceUpdateState();
        });
      }
    });
  });

  reduxAction("SET_MATCHES_FETCH_STATE", {
    total: self.globalData.matchesIndex.length,
    saved,
  });
}
