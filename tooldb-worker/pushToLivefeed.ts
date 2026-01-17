/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */

import { DbMatch } from "./dbTypes";

export default async function pushToLiveFeed(key: string, match: DbMatch) {
  if (!self.globalData.liveFeed[key]) {
    // In the new tool-db, we don't use Automerge CRDTs
    // Instead, we use regular put operations with merge logic
    try {
      const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
      const liveFeedKey = `matches-livefeed-${currentDay}`;

      // Add the match to the live feed
      self.globalData.liveFeed[key] = new Date(match.internalMatch.date).getTime();

      // Put the updated live feed data
      self.toolDb.putData(liveFeedKey, self.globalData.liveFeed, false);
    } catch (e) {
      console.warn(e);
    }
  }
}
