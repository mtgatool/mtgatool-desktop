/* eslint-disable no-param-reassign */
import Automerge from "automerge";

import { DbMatch } from "../types/dbTypes";

export default async function pushToExplore(key: string, match: DbMatch) {
  // Create CRDT document with the new match added to it
  try {
    const docInit = Automerge.init<Record<string, number>>();

    const newDocument = Automerge.change(docInit, (doc) => {
      doc[key] = new Date(match.internalMatch.date).getTime();
    });

    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    window.toolDb
      .putCrdt(
        `explore-${currentDay}-${match.eventId}`,
        Automerge.getChanges(docInit, newDocument),
        false
      )
      .catch(console.error);
  } catch (e) {
    console.warn(e);
  }
}
