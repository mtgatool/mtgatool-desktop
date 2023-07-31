import reduxAction from "./reduxAction";

export default function handleDraftsIndex(draftsIndex: string[] | null) {
  window.globalData.draftsIndex = [
    ...new Set([...window.globalData.draftsIndex, ...(draftsIndex || [])]),
  ];
  console.log("handleDraftsIndex", window.globalData.draftsIndex);

  // Fetch any match we dont have locally
  window.globalData.draftsIndex.forEach((id: string) => {
    window.toolDb.store.get(id, (err, data) => {
      if (!data) {
        window.toolDb.getData(id, false, 2000);
      }
    });
  });

  reduxAction("SET_DRAFTS_INDEX", window.globalData.draftsIndex);
}
