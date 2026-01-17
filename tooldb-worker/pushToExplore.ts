/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */

import { DbMatch } from "./dbTypes";

export default async function pushToExplore(key: string, match: DbMatch) {
  // In the new tool-db, we don't use Automerge CRDTs
  // Instead, we use regular put operations with merge logic on the receiving end
  try {
    const { eventId } = match;
    if (!eventId.includes("NPE_") && !eventId.includes("ColorChallenge_")) {
      const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
      const exploreKey = `explore-${currentDay}-${eventId}`;

      // Get existing data and merge
      const existingData = await self.toolDb.getData<Record<string, number>>(exploreKey);
      const updatedData = {
        ...(existingData || {}),
        [key]: new Date(match.internalMatch.date).getTime(),
      };

      self.toolDb.putData(exploreKey, updatedData, false);
    }
  } catch (e) {
    console.warn(e);
  }
}
