/**
 * Tombstones for user-deleted matches.
 *
 * Deleting a match locally is not enough to make it stay deleted: three paths
 * happily re-create it afterwards —
 *   - `hydrateFromCloud` pulls every Supabase row back into the KV on login,
 *   - `syncMatches` re-pushes any local row the cloud is missing,
 *   - a full log re-import (`importLogHistory`) replays old matches through
 *     `setDbMatch`.
 * So a delete records the match id here (persisted in the same KV, key
 * `deletedMatches`) and each of those paths skips ids in the list.
 *
 * Kept in an in-memory cache because it is read on every match write.
 */
import { getData, putData } from "./store";

const KEY = "deletedMatches";

let cache: Set<string> | null = null;

/** The set of match ids the user has deleted. Cached after the first read. */
export async function getDeletedMatchIds(): Promise<Set<string>> {
  if (!cache) {
    const stored = await getData<string[]>(KEY, true);
    cache = new Set(stored || []);
  }
  return cache;
}

export async function isMatchDeleted(matchId: string): Promise<boolean> {
  return (await getDeletedMatchIds()).has(matchId);
}

export async function addDeletedMatchId(matchId: string): Promise<void> {
  const ids = await getDeletedMatchIds();
  if (ids.has(matchId)) return;
  ids.add(matchId);
  await putData<string[]>(KEY, [...ids], true);
}
