/**
 * Minimal IndexedDB key/value store. This is the local persistence layer
 * that replaced tool-db (see docs/LEGACY_TOOLDB_DATA_MODEL.md). Values are
 * stored as plain structured-clone objects under string keys; prefix queries
 * power the matches/drafts indexes.
 */

const DB_NAME = "mtgatool-local";
const STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function withStore<T>(
  mode: "readonly" | "readwrite",
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      })
  );
}

export function kvGet<T>(key: string): Promise<T | null> {
  return withStore<T | undefined>("readonly", (s) => s.get(key)).then(
    (v) => v ?? null
  );
}

export function kvPut<T>(key: string, value: T): Promise<void> {
  return withStore<unknown>("readwrite", (s) => s.put(value, key)).then(
    () => undefined
  );
}

export function kvDelete(key: string): Promise<void> {
  return withStore<undefined>("readwrite", (s) => s.delete(key)).then(
    () => undefined
  );
}

/** All stored keys that start with `prefix`. */
export function kvQueryKeys(prefix: string): Promise<string[]> {
  const range = IDBKeyRange.bound(prefix, `${prefix}\uffff`);
  return withStore<unknown[]>("readonly", (s) => s.getAllKeys(range)).then(
    (keys) => keys.map(String)
  );
}
