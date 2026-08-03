/**
 * Local-only data store, replacing the tool-db worker-wrapper
 * (see docs/LEGACY_TOOLDB_DATA_MODEL.md).
 *
 * Keeps the same function surface the app already used (getData, putData,
 * queryKeys, getMatchesData, ...) but implemented on plain IndexedDB, with
 * no network, no crypto and no worker. The Supabase-backed cloud layer will
 * slot in behind these same calls (or replace them with a richer DataStore).
 */

import {
  convertDbMatchToData,
  MatchData,
} from "../components/views/history/convertDbMatchData";
import { DbMatch } from "../types/dbTypes";
import { kvDelete, kvGet, kvPut, kvQueryKeys } from "./localKV";

// The local KV is single-user-per-device: everything a signed-in user owns is
// stored under one fixed namespace. Keys used to be `:${pubKey}.${key}` under
// tool-db's ECDSA identity; that's gone, so it's just `:local.`.
export const LOCAL_KEY = "local";

export function getUserNamespacedKey(key: string) {
  return `:${LOCAL_KEY}.${key}`;
}

function resolveKey(key: string, userNamespaced: boolean) {
  return userNamespaced ? getUserNamespacedKey(key) : key;
}

export function getData<T = any>(
  key: string,
  userNamespaced = false,
  _timeoutMs = 5000
): Promise<T | null> {
  return kvGet<T>(resolveKey(key, userNamespaced));
}

export function getLocalData<T = any>(
  key: string,
  userNamespaced = false
): Promise<T | null> {
  return getData<T>(key, userNamespaced);
}

export function putData<T = any>(
  key: string,
  data: T,
  userNamespaced = false
): Promise<boolean> {
  return kvPut(resolveKey(key, userNamespaced), data).then(() => true);
}

export function deleteData(key: string, userNamespaced = false): Promise<void> {
  return kvDelete(resolveKey(key, userNamespaced));
}

/** Returns full stored keys (including the `:local.` prefix) as the legacy API did. */
export function queryKeys(
  key: string,
  userNamespaced = false,
  _timeoutMs = 5000
): Promise<string[] | null> {
  return kvQueryKeys(resolveKey(key, userNamespaced));
}

/** Fetch full match documents for an index of (full) match keys. */
export function getMatchesData(
  matchesIndex: string[],
  uuid?: string
): Promise<MatchData[] | null> {
  const unique = [...new Set(matchesIndex)];
  return Promise.all(unique.map((key) => kvGet<DbMatch>(key))).then((matches) =>
    matches
      .filter((m): m is DbMatch => !!m)
      .map(convertDbMatchToData)
      .filter((m) => (uuid ? m.uuid === uuid : true))
  );
}
