/**
 * Minimal IndexedDB key/value store. This is the local persistence layer
 * that replaced tool-db (see docs/LEGACY_TOOLDB_DATA_MODEL.md). Values are
 * stored as plain structured-clone objects under string keys; prefix queries
 * power the matches/drafts indexes.
 */

const DB_NAME = "mtgatool-local";
const STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function createStore(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
}

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      // Opened WITHOUT a version on purpose. A hardcoded version can only ever
      // go up, and opening below the database's current version throws
      // VersionError — so pinning it to 1 while the recovery below bumps to 2
      // would leave the store permanently unopenable. No version means "whatever
      // exists", creating it at 1 (firing onupgradeneeded) if it does not.
      const req = indexedDB.open(DB_NAME);
      req.onupgradeneeded = () => createStore(req.result);
      req.onsuccess = () => {
        const db = req.result;
        if (db.objectStoreNames.contains(STORE)) {
          resolve(db);
          return;
        }
        // The database exists but has no object store, so onupgradeneeded never
        // fired and every read would throw NotFoundError forever. Anything that
        // opens `mtgatool-local` before the app does leaves it in exactly this
        // state — a devtools console poke is enough. Reopening one version up is
        // the only way to get an upgrade transaction.
        const next = db.version + 1;
        db.close();
        const upgrade = indexedDB.open(DB_NAME, next);
        upgrade.onupgradeneeded = () => createStore(upgrade.result);
        upgrade.onsuccess = () => resolve(upgrade.result);
        upgrade.onerror = () => {
          dbPromise = null;
          reject(upgrade.error);
        };
      };
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

/**
 * Wipe every key in the store.
 *
 * Used when the local store turns out to belong to a different account — see
 * `claimLocalStore`. Clears the object store rather than deleting the database:
 * other windows hold an open connection, and `deleteDatabase` blocks on them.
 */
export function kvClear(): Promise<void> {
  return withStore<undefined>("readwrite", (s) => s.clear()).then(
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
