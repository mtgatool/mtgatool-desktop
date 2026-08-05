/* eslint-disable no-console */
/**
 * Get the bytes the card database worker needs: the SQLite wasm engine, and the
 * database file itself.
 *
 * The worker cannot do this for itself. Under a packaged build the windows load
 * from `file://` and `nodeIntegrationInWorker` is off, so a worker has neither
 * Node nor a `fetch` we would want to depend on. The window does have Node, so
 * it reads both here and transfers the buffers in.
 */
import electron from "../electron/electronWrapper";
import remote from "../electron/remoteWrapper";

export interface CardsDbBytes {
  wasmBinary: ArrayBuffer;
  dbBytes: ArrayBuffer;
  source: string;
}

/**
 * Where the database may be found, best first.
 *
 * `userData` is where a synced copy will land once the release pipeline ships
 * SQLite, and mirrors what database.json already does. The repo path below it
 * is the one that matters today: drop a build from mtgatool-metadata's
 * `npm run sqlite` into src/assets/resources/ and it gets picked up, exactly
 * the way database.json is used for local work.
 */
function dbCandidates(path: any, appPath: string, userData: string): string[] {
  return [
    path.join(userData, "cards.sqlite"),
    path.join(appPath, "build", "resources", "en-database.sqlite"),
    path.join(appPath, "src", "assets", "resources", "en-database.sqlite"),
    path.join(
      process.cwd(),
      "src",
      "assets",
      "resources",
      "en-database.sqlite"
    ),
  ];
}

function wasmCandidates(path: any, appPath: string): string[] {
  return [
    path.join(appPath, "build", "cards-db-worker", "sqlite3.wasm"),
    path.join(appPath, "public", "cards-db-worker", "sqlite3.wasm"),
    path.join(process.cwd(), "public", "cards-db-worker", "sqlite3.wasm"),
  ];
}

function toArrayBuffer(buffer: any): ArrayBuffer {
  // Node Buffers are views into a shared pool, so the byteOffset matters —
  // handing `buffer.buffer` straight over would transfer the whole pool and
  // give the worker the wrong bytes.
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function loadElectron(): CardsDbBytes | null {
  // eslint-disable-next-line no-undef
  const fs = __non_webpack_require__("fs");
  // eslint-disable-next-line no-undef
  const path = __non_webpack_require__("path");

  const appPath = remote ? remote.app.getAppPath() : process.cwd();
  const userData = remote ? remote.app.getPath("userData") : process.cwd();

  const first = (list: string[]): string | null =>
    list.find((p) => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    }) || null;

  const dbPath = first(dbCandidates(path, appPath, userData));
  if (!dbPath) {
    console.log(
      "[cards-db] no SQLite database found; staying on the JSON path. " +
        `Looked in:\n  ${dbCandidates(path, appPath, userData).join("\n  ")}`
    );
    return null;
  }

  const wasmPath = first(wasmCandidates(path, appPath));
  if (!wasmPath) {
    console.log(
      "[cards-db] sqlite3.wasm is missing — run `npm run build:cards-db-worker`."
    );
    return null;
  }

  return {
    wasmBinary: toArrayBuffer(fs.readFileSync(wasmPath)),
    dbBytes: toArrayBuffer(fs.readFileSync(dbPath)),
    source: dbPath,
  };
}

async function loadWeb(): Promise<CardsDbBytes | null> {
  const base = window.location.origin;
  try {
    const [wasm, db] = await Promise.all([
      fetch(`${base}/cards-db-worker/sqlite3.wasm`),
      fetch(`${base}/en-database.sqlite`),
    ]);
    if (!wasm.ok || !db.ok) {
      console.log(
        `[cards-db] web assets unavailable (wasm ${wasm.status}, db ${db.status});` +
          ` staying on the JSON path.`
      );
      return null;
    }
    return {
      wasmBinary: await wasm.arrayBuffer(),
      dbBytes: await db.arrayBuffer(),
      source: `${base}/en-database.sqlite`,
    };
  } catch (e) {
    console.log("[cards-db] web assets failed to load, staying on JSON", e);
    return null;
  }
}

/** Resolves null whenever the SQLite path is not available, never throws. */
export default async function loadCardsDbBytes(): Promise<CardsDbBytes | null> {
  try {
    return electron ? loadElectron() : await loadWeb();
  } catch (e) {
    console.log("[cards-db] could not load database bytes", e);
    return null;
  }
}
