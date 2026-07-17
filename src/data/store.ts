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
import { kvGet, kvPut, kvQueryKeys } from "./localKV";

/**
 * Legacy user-namespaced keys were `:${pubKey}.${key}`. In local mode there
 * is a single implicit profile, so everything lives under `:local.`.
 * The pubKey argument is accepted (and ignored) for call-site compatibility.
 */
export function getUserNamespacedKey(_pubKey: string, key: string) {
  return `:local.${key}`;
}

function resolveKey(key: string, userNamespaced: boolean) {
  return userNamespaced ? getUserNamespacedKey("", key) : key;
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

// ---------------------------------------------------------------------------
// Network-era APIs kept as inert stubs so remaining call sites don't break.
// These all resolved from the p2p swarm; without a network they resolve to
// "nothing". The Supabase layer will give them real implementations (or the
// call sites will be rewritten against it directly).
// ---------------------------------------------------------------------------

/** Legacy server-side function calls (explore aggregation, avatars, ...). */
export function doFunction<T = any>(
  _fname: string,
  _args = {},
  _timeoutMs = 5000
): Promise<{ return: T | null; code: string } | null> {
  return Promise.resolve(null);
}

export function subscribeData(
  _key: string,
  _userNamespaced = false
): Promise<null> {
  return Promise.resolve(null);
}

export function addKeyListener(_key: string): Promise<number> {
  return Promise.resolve(-1);
}

export function removeKeyListener(_listenerId: number): Promise<null> {
  return Promise.resolve(null);
}
