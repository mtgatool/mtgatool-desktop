/**
 * Reconcile drafts with the cloud: merge deletion tombstones both ways, drop
 * local copies of drafts deleted elsewhere, then push what the cloud is
 * missing. The pull direction lives in hydrateFromCloud, which restores cloud
 * drafts on login before localLogin indexes the KV.
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { InternalDraftv2 } from "../types";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import {
  deleteRemoteDraft,
  fetchDeletedDraftIds,
  isCloudActive,
  pushDraft,
} from "./cloudSync";
import { addDeletedDraftId, getDeletedDraftIds } from "./deletedDrafts";
import { kvGet } from "./localKV";
import { deleteData, getUserNamespacedKey, queryKeys } from "./store";
import supabase from "./supabase";

async function fetchRemoteDraftIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("drafts").select("draft_id");
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.draft_id));
}

export default async function syncDrafts(): Promise<number> {
  if (!(await isCloudActive())) return 0;

  const [remote, localKeys, cloudDeleted] = await Promise.all([
    fetchRemoteDraftIds(),
    queryKeys("draft-", true),
    fetchDeletedDraftIds(),
  ]);

  // Union of what this device deleted and what any other device deleted.
  const deleted = await getDeletedDraftIds();
  const fresh = [...cloudDeleted].filter((id) => !deleted.has(id));
  await Promise.all(fresh.map((id) => addDeletedDraftId(id)));

  // Drop any local copy of a draft deleted elsewhere.
  const removedKeys: string[] = [];
  await Promise.all(
    [...deleted].map(async (id) => {
      const key = getUserNamespacedKey(`draft-${id}`);
      if (!(localKeys ?? []).includes(key)) return;
      await deleteData(`draft-${id}`, true);
      removedKeys.push(key);
    })
  );
  if (removedKeys.length) {
    globalData.draftsIndex = globalData.draftsIndex.filter(
      (k) => !removedKeys.includes(k)
    );
    reduxAction(store.dispatch, {
      type: "REMOVE_DRAFTS_FROM_INDEX",
      arg: removedKeys,
    });
  }

  const localDrafts = (
    await Promise.all(
      (localKeys ?? [])
        .filter((k) => !removedKeys.includes(k))
        .map((k) => kvGet<InternalDraftv2>(k))
    )
  ).filter((d): d is InternalDraftv2 => !!d && !!d.id);

  // Retry path for a delete made while offline: the row may still be up there.
  await Promise.all(
    [...deleted]
      .filter((id) => remote.has(id))
      .map((id) =>
        deleteRemoteDraft(id).then((ok) => {
          if (ok) remote.delete(id);
        })
      )
  );

  // Drafts recorded before the persona was known have no arenaId baked in;
  // fall back to the current one so that backlog still syncs.
  const currentPersona = getLocalSetting("playerId");
  const missing = localDrafts.filter(
    (d) => !remote.has(d.id as string) && !deleted.has(d.id as string)
  );
  const results = await Promise.all(
    missing.map((d) => pushDraft(d.arenaId || currentPersona, d))
  );
  return results.filter(Boolean).length;
}
