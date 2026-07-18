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
import { fetchRemoteMatchIds, isCloudActive, pushMatch } from "./cloudSync";
import { kvGet } from "./localKV";
import { LOCAL_KEY, queryKeys } from "./store";

/** The key the history UI compares against `remoteMatchesIndex`. */
function matchKey(matchId: string): string {
  return `:${LOCAL_KEY}.matches-${matchId}`;
}

/** Returns the number of matches pushed to close the gap. */
export default async function syncMatches(): Promise<number> {
  if (!(await isCloudActive())) return 0;

  const [remote, localKeys] = await Promise.all([
    fetchRemoteMatchIds(),
    queryKeys("matches-", true),
  ]);

  const localMatches = (
    await Promise.all((localKeys ?? []).map((k) => kvGet<DbMatch>(k)))
  ).filter((m): m is DbMatch => !!m && !!m.matchId);

  // Push everything the cloud is missing (arena_id = the match's playerId).
  // Matches saved during the catch-up read — before the persona was read from
  // memory — have an empty playerId baked in, which pushMatch rejects. Fall
  // back to the current persona so that backlog still syncs.
  const currentPersona = getLocalSetting("playerId");
  const missing = localMatches.filter((m) => !remote.has(m.matchId));
  await Promise.all(
    missing.map((m) => pushMatch(m.playerId || currentPersona, m))
  );
  missing.forEach((m) => remote.add(m.matchId));

  // Reflect the full synced set so the per-match cloud icon is accurate.
  reduxAction(store.dispatch, {
    type: "SET_REMOTE_MATCHES_INDEX",
    arg: [...remote].map((id) => matchKey(id)),
  });

  return missing.length;
}
