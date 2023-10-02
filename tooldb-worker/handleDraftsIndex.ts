/* eslint-disable no-restricted-globals */
import reduxAction from "./reduxAction";

export default function handleDraftsIndex(draftsIndex: string[] | null) {
  self.globalData.draftsIndex = [
    ...new Set([...self.globalData.draftsIndex, ...(draftsIndex || [])]),
  ];
  console.log("handleDraftsIndex", self.globalData.draftsIndex);

  // Fetch any match we dont have locally
  self.globalData.draftsIndex.forEach((id: string) => {
    self.toolDb.store.get(id, (err, data) => {
      if (!data) {
        self.toolDb.getData(id, false, 2000);
      }
    });
  });

  reduxAction("SET_DRAFTS_INDEX", self.globalData.draftsIndex);
}
