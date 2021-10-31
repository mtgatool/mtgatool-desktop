/* eslint-disable no-param-reassign */
import Automerge from "automerge";

import { DbMatch } from "../types/dbTypes";
import globalData from "../utils/globalData";

export default async function pushToLiveFeed(key: string, match: DbMatch) {
  if (!globalData.liveFeed[key]) {
    // Create CRDT document with the new match added to it
    const newLiveFeed = Automerge.change(globalData.liveFeed, (doc) => {
      doc[key] = new Date(match.internalMatch.date).getTime();
    });

    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    window.toolDb
      .putCrdt(
        `matches-livefeed-${currentDay}`,
        Automerge.getChanges(globalData.liveFeed, newLiveFeed),
        false
      )
      .catch(console.error);
    // globalData.liveFeed = newLiveFeed;
  }
}
