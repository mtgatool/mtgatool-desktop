/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
import Automerge from "automerge";

import { DbMatch } from "./dbTypes";

export default async function pushToLiveFeed(key: string, match: DbMatch) {
  if (!self.globalData.liveFeed[key]) {
    // Create CRDT document with the new match added to it
    try {
      const newLiveFeed = Automerge.change(self.globalData.liveFeed, (doc) => {
        doc[key] = new Date(match.internalMatch.date).getTime();
      });

      const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
      window.toolDb
        .putCrdt(
          `matches-livefeed-${currentDay}`,
          Automerge.getChanges(self.globalData.liveFeed, newLiveFeed),
          false
        )
        .catch(console.error);
      // self.globalData.liveFeed = newLiveFeed;
    } catch (e) {
      console.warn(e);
    }
  }
}
