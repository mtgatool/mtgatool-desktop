/**
 * Reconcile the local match history with Supabase.
 *
 * Pushes are otherwise only mirrored when a match is played live; this fills
 * the gaps — games played while the tracker was off (caught later by
 * re-reading the logs) and anything played offline. It also refreshes the
 * per-match "synced" indicator (`mainData.remoteMatchesIndex`), which is what
 * the cloud icon in the history list reads.
 *
 * No-op when signed in locally/offline.
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import {
  deleteRemoteMatch,
  fetchDeletedMatchIds,
  fetchRemoteMatchIds,
  isCloudActive,
  pushMatch,
} from "./cloudSync";
import { addDeletedMatchId, getDeletedMatchIds } from "./deletedMatches";
import { kvGet } from "./localKV";
import { deleteData, LOCAL_KEY, queryKeys } from "./store";

/** The key the history UI compares against `remoteMatchesIndex`. */
function matchKey(matchId: string): string {
  return `:${LOCAL_KEY}.matches-${matchId}`;
}

/** Returns the number of matches pushed to close the gap. */
export default async function syncMatches(): Promise<number> {
  if (!(await isCloudActive())) return 0;

  const [remote, localKeys, cloudDeleted] = await Promise.all([
    fetchRemoteMatchIds(),
    queryKeys("matches-", true),
    fetchDeletedMatchIds(),
  ]);

  // Union of what this device deleted and what any other device deleted. Local
  // tombstones alone are not enough: a match deleted on another device is still
  // sitting in this one's KV, and without knowing it was deleted we'd push it
  // back to the cloud and resurrect it everywhere.
  const deleted = await getDeletedMatchIds();
  const fresh = [...cloudDeleted].filter((id) => !deleted.has(id));
  await Promise.all(fresh.map((id) => addDeletedMatchId(id)));

  // Drop any local copy of a match deleted elsewhere, so this device stops
  // showing it and stops offering it back to the cloud.
  const removedKeys: string[] = [];
  await Promise.all(
    [...deleted].map(async (id) => {
      const key = matchKey(id);
      if (!(localKeys ?? []).includes(key)) return;
      await deleteData(`matches-${id}`, true);
      removedKeys.push(key);
    })
  );
  if (removedKeys.length) {
    globalData.matchesIndex = globalData.matchesIndex.filter(
      (k) => !removedKeys.includes(k)
    );
    reduxAction(store.dispatch, {
      type: "REMOVE_MATCHES_FROM_INDEX",
      arg: removedKeys,
    });
  }

  const localMatches = (
    await Promise.all(
      (localKeys ?? [])
        .filter((k) => !removedKeys.includes(k))
        .map((k) => kvGet<DbMatch>(k))
    )
  ).filter((m): m is DbMatch => !!m && !!m.matchId);

  // Retry path for a delete made while offline: the row may still be up there.
  await Promise.all(
    [...deleted]
      .filter((id) => remote.has(id))
      .map((id) =>
        deleteRemoteMatch(id).then((ok) => {
          if (ok) remote.delete(id);
        })
      )
  );

  // Push everything the cloud is missing (arena_id = the match's playerId).
  // Matches saved during the catch-up read — before the persona was read from
  // memory — have an empty playerId baked in, which pushMatch rejects. Fall
  // back to the current persona so that backlog still syncs.
  const currentPersona = getLocalSetting("playerId");
  const missing = localMatches.filter(
    (m) => !remote.has(m.matchId) && !deleted.has(m.matchId)
  );
  await Promise.all(
    missing.map((m) => pushMatch(m.playerId || currentPersona, m))
  );
  missing.forEach((m) => remote.add(m.matchId));

  // Reflect the full synced set so the per-match cloud icon is accurate. The
  // index reducer is additive, so anything still tombstoned has to be filtered
  // out here or it comes back as a phantom entry.
  reduxAction(store.dispatch, {
    type: "SET_REMOTE_MATCHES_INDEX",
    arg: [...remote].filter((id) => !deleted.has(id)).map((id) => matchKey(id)),
  });

  return missing.length;
}
