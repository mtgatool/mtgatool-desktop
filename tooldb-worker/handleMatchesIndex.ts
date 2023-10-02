/* eslint-disable no-restricted-globals */
import getMatchesData from "./getMatchesData";
import reduxAction from "./reduxAction";

export default function handleMatchesIndex(matchesIds: string[] | null) {
  const matchesIndex = [...new Set([...(matchesIds || [])])];

  let saved = 0;
  let timeout: NodeJS.Timeout | null = null;
  let lastUpdate = new Date().getTime();

  function updateState() {
    timeout = null;
    reduxAction("SET_MATCHES_FETCH_STATE", {
      total: matchesIndex.length,
      saved,
    });

    if (saved === matchesIndex.length && matchesIndex.length > 0) {
      reduxAction("SET_MATCHES_INDEX", matchesIndex);

      getMatchesData("MATCHES_DATA", matchesIndex, self.globalData.currentUUID);
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
  matchesIndex.forEach((id: string) => {
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

  updateState();
}
