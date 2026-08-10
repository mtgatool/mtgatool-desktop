/**
 * Delete a draft everywhere it lives: the local KV, the in-memory index, the
 * Redux index the drafts list reads, and Supabase — deleteMatch's shape.
 *
 * The tombstone is written first so a hydrate or sync racing this call can't
 * put the draft back, and so the delete survives an offline cloud (syncDrafts
 * retries the remote delete on the next reconcile).
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import globalData from "../utils/globalData";
import { deleteRemoteDraft, pushDeletedDraft } from "./cloudSync";
import { addDeletedDraftId } from "./deletedDrafts";
import { deleteData, getUserNamespacedKey } from "./store";

export default async function deleteDraft(draftId: string): Promise<void> {
  if (!draftId) return;

  const storedKey = getUserNamespacedKey(`draft-${draftId}`);

  await addDeletedDraftId(draftId);
  await deleteData(`draft-${draftId}`, true);

  globalData.draftsIndex = globalData.draftsIndex.filter(
    (k) => k !== storedKey
  );
  reduxAction(store.dispatch, {
    type: "REMOVE_DRAFTS_FROM_INDEX",
    arg: [storedKey],
  });

  await pushDeletedDraft(draftId);
  await deleteRemoteDraft(draftId);
}
