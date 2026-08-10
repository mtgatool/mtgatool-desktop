/**
 * Tombstones for user-deleted drafts — the deletedMatches pattern, verbatim.
 * The same three paths would otherwise re-create a deleted draft: cloud
 * hydrate at login, syncDrafts re-pushing local rows, and a full log
 * re-import replaying the draft.
 */
import { getData, putData } from "./store";

const KEY = "deletedDrafts";

let cache: Set<string> | null = null;

/** The set of draft ids the user has deleted. Cached after the first read. */
export async function getDeletedDraftIds(): Promise<Set<string>> {
  if (!cache) {
    const stored = await getData<string[]>(KEY, true);
    cache = new Set(stored || []);
  }
  return cache;
}

export async function isDraftDeleted(draftId: string): Promise<boolean> {
  return (await getDeletedDraftIds()).has(draftId);
}

export async function addDeletedDraftId(draftId: string): Promise<void> {
  const ids = await getDeletedDraftIds();
  if (ids.has(draftId)) return;
  ids.add(draftId);
  await putData<string[]>(KEY, [...ids], true);
}
