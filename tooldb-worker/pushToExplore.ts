/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
import Automerge from "automerge";

import { DbMatch } from "./dbTypes";

export default async function pushToExplore(key: string, match: DbMatch) {
  // Create CRDT document with the new match added to it
  try {
    const docInit = Automerge.init<Record<string, number>>();

    const { eventId } = match;
    if (!eventId.includes("NPE_") && !eventId.includes("ColorChallenge_")) {
      const newDocument = Automerge.change(docInit, (doc) => {
        doc[key] = new Date(match.internalMatch.date).getTime();
      });

      const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
      self.toolDb
        .putCrdt(
          `explore-${currentDay}-${eventId}`,
          Automerge.getChanges(docInit, newDocument),
          false
        )
        .catch(console.error);
    }
  } catch (e) {
    console.warn(e);
  }
}
