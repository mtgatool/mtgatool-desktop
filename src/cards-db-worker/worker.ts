/* eslint-disable no-restricted-globals */
/* eslint-disable no-bitwise */
/**
 * The card database, and the only copy of it.
 *
 * Everything about how this worker is fed is dictated by where the app runs.
 * In a packaged build the windows load from `file://`, and:
 *
 *   - `nodeIntegrationInWorker` is off, so this worker cannot read a file.
 *   - `fetch` against `file://` is not something to rely on, which rules out
 *     letting the wasm glue load `sqlite3.wasm` by URL.
 *
 * So the window — which does have Node — reads both the wasm and the database
 * and *transfers* the ArrayBuffers in. Transfer, not clone: the buffers move,
 * they are not copied, which is the entire point of doing this at all. The
 * previous cards worker was handed a structured clone of the whole 26k-card
 * object graph on every collection mount.
 *
 * The database is opened with `sqlite3_deserialize`, i.e. the file image lives
 * in the wasm heap. There is no Node-fs VFS in the official wasm build, so
 * pages cannot be read lazily from disk here the way they can natively; one
 * ~17MB flat allocation is the cost, and it replaces several copies of a
 * ~93MB object graph.
 */
// Copied in by scripts/build-cards-db-worker.js, so it does not exist in the
// source tree for eslint to resolve.
// eslint-disable-next-line import/no-unresolved
import sqlite3InitModule from "./sqlite3.mjs";

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

type Request =
  | { type: "init"; id: number; wasmBinary: ArrayBuffer; dbBytes: ArrayBuffer }
  | {
      type: "setCollection";
      id: number;
      cards: Record<string, number>;
      prevCards: Record<string, number>;
    }
  | { type: "query"; id: number; sql: string; params: unknown[] };

let db: any = null;
let sqlite3: any = null;

/** Rows as columns + tuples: far cheaper to clone back than objects. */
function run(sql: string, params: unknown[] = []): QueryResult {
  const result: QueryResult = { columns: [], values: [] };
  db.exec({
    sql,
    bind: params.length ? params : undefined,
    rowMode: "array",
    columnNames: result.columns,
    callback: (row: unknown[]) => {
      result.values.push(row);
    },
  });
  return result;
}

async function init(wasmBinary: ArrayBuffer, dbBytes: ArrayBuffer) {
  sqlite3 = await sqlite3InitModule({
    wasmBinary,
    // Called eagerly to build a URL string even when wasmBinary is supplied.
    // It must not throw, but nothing ever loads from the path it returns.
    locateFile: (file: string) => file,
    print: () => undefined,
    printErr: () => undefined,
  });

  db = new sqlite3.oo1.DB();

  const bytes = new Uint8Array(dbBytes);
  const p = sqlite3.wasm.allocFromTypedArray(bytes);
  const rc = sqlite3.capi.sqlite3_deserialize(
    db.pointer,
    "main",
    p,
    bytes.length,
    bytes.length,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
  );
  if (rc !== 0) {
    throw new Error(`sqlite3_deserialize failed (${rc})`);
  }

  // The player's collection is not part of the shipped database — it is per
  // account and changes as packs are opened. It lives in a temp table so
  // `owned` and `acquired` are columns like any other and the collection view
  // can filter and sort on them in SQL instead of in JS.
  db.exec(`
    CREATE TEMP TABLE collection (
      grpid INTEGER PRIMARY KEY,
      owned INTEGER NOT NULL DEFAULT 0,
      prev  INTEGER NOT NULL DEFAULT 0
    );
  `);

  const meta = run("SELECT key, value FROM meta");
  const info: Record<string, unknown> = {};
  meta.values.forEach(([k, v]) => {
    info[String(k)] = v;
  });
  return info;
}

function setCollection(
  cards: Record<string, number>,
  prevCards: Record<string, number>
): number {
  db.exec("DELETE FROM collection");

  const grpIds: Record<string, boolean> = {};
  Object.keys(cards).forEach((k) => {
    grpIds[k] = true;
  });
  Object.keys(prevCards).forEach((k) => {
    grpIds[k] = true;
  });

  const stmt = db.prepare(
    "INSERT INTO collection (grpid, owned, prev) VALUES (?, ?, ?)"
  );
  try {
    db.exec("BEGIN");
    Object.keys(grpIds).forEach((key) => {
      stmt.bind([parseInt(key, 10), cards[key] || 0, prevCards[key] || 0]);
      stmt.stepReset();
    });
    db.exec("COMMIT");
  } finally {
    stmt.finalize();
  }

  return Object.keys(grpIds).length;
}

self.onmessage = async (e: MessageEvent<Request>): Promise<void> => {
  const msg = e.data;
  try {
    let result: unknown;
    switch (msg.type) {
      case "init":
        result = await init(msg.wasmBinary, msg.dbBytes);
        break;
      case "setCollection":
        result = setCollection(msg.cards, msg.prevCards);
        break;
      case "query":
        if (!db) throw new Error("Query before init");
        result = run(msg.sql, msg.params);
        break;
      default:
        throw new Error(`Unknown message: ${(msg as any).type}`);
    }
    self.postMessage({ id: msg.id, ok: true, result });
  } catch (error: any) {
    self.postMessage({
      id: msg.id,
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
};
