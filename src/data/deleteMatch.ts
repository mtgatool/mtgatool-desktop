/**
 * Delete a match everywhere it lives: the local KV, the in-memory index, the
 * Redux indexes the history/stats views read, and Supabase.
 *
 * The tombstone (see ./deletedMatches) is written *first* so that a hydrate or
 * sync racing this call can't put the match back, and so the delete survives an
 * offline cloud (syncMatches retries the remote delete on the next reconcile).
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import globalData from "../utils/globalData";
import { deleteRemoteMatch, pushDeletedMatch } from "./cloudSync";
import { addDeletedMatchId } from "./deletedMatches";
import { deleteData, getUserNamespacedKey } from "./store";

export default async function deleteMatch(matchId: string): Promise<void> {
  if (!matchId) return;

  const storedKey = getUserNamespacedKey(`matches-${matchId}`);

  await addDeletedMatchId(matchId);
  await deleteData(`matches-${matchId}`, true);

  globalData.matchesIndex = globalData.matchesIndex.filter(
    (k) => k !== storedKey
  );

  // Both index halves: the match may be in either (or both), and the combined
  // `matchesIndex` is what ContentWrapper re-reads to rebuild matchesData —
  // which is what every stats aggregation downstream is derived from.
  reduxAction(store.dispatch, {
    type: "REMOVE_MATCHES_FROM_INDEX",
    arg: [storedKey],
  });

  // Both halves matter. Removing the row alone is not enough: any other device
  // still holding this match would see the cloud "missing" it and push it back.
  // The tombstone is what tells them it was deleted on purpose.
  await pushDeletedMatch(matchId);
  await deleteRemoteMatch(matchId);
}
