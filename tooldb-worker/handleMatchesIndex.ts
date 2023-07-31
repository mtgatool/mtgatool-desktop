import reduxAction from "./reduxAction";

export default function handleMatchesIndex(matchesIndex: string[] | null) {
  window.globalData.matchesIndex = [
    ...new Set([...window.globalData.matchesIndex, ...(matchesIndex || [])]),
  ];
  console.log("handleMatchesIndex", window.globalData.matchesIndex);

  // Fetch any match we dont have locally
  window.globalData.matchesIndex.forEach((id: string) => {
    window.toolDb.store.get(id, (err, data) => {
      if (!data) {
        window.toolDb.getData(id, false, 2000);
      }
    });
  });

  reduxAction("SET_MATCHES_INDEX", window.globalData.matchesIndex);
}
