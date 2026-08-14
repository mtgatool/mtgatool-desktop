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
import getLocalSetting from "../getLocalSetting";
import {
  ensureDatabaseFile,
  fetchDatabaseWeb,
  isSqliteBytes,
} from "./fetchCardsDb";

export interface CardsDbBytes {
  wasmBinary: ArrayBuffer;
  dbBytes: ArrayBuffer;
  source: string;
}

/**
 * Local databases, checked before anything is downloaded.
 *
 * Drop a build from mtgatool-metadata's `npm run sqlite` into
 * src/assets/resources/ and it wins over the published one — which is how you
 * test a schema change without cutting a release. Otherwise the released
 * database is downloaded into userData; see fetchCardsDb.
 */
function localCandidates(path: any, appPath: string, lang: string): string[] {
  const names = [`${lang}-database.sqlite`, "en-database.sqlite"];
  const dirs = [
    path.join(appPath, "build", "resources"),
    path.join(appPath, "src", "assets", "resources"),
    path.join(process.cwd(), "src", "assets", "resources"),
  ];
  const out: string[] = [];
  dirs.forEach((dir) =>
    names.forEach((name) => out.push(path.join(dir, name)))
  );
  return out;
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

async function loadElectron(lang: string): Promise<CardsDbBytes | null> {
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

  const wasmPath = first(wasmCandidates(path, appPath));
  if (!wasmPath) {
    console.log(
      "[cards-db] sqlite3.wasm is missing — run `npm run build:cards-db-worker`."
    );
    return null;
  }

  // A local build always wins, so a schema change can be tested without
  // publishing one.
  let dbPath = first(localCandidates(path, appPath, lang));
  if (dbPath) {
    console.log(`[cards-db] using local database ${dbPath}`);
  } else {
    dbPath = await ensureDatabaseFile(userData, lang);
  }

  if (!dbPath) {
    console.log("[cards-db] no database available.");
    return null;
  }

  return {
    wasmBinary: toArrayBuffer(fs.readFileSync(wasmPath)),
    dbBytes: toArrayBuffer(fs.readFileSync(dbPath)),
    source: dbPath,
  };
}

async function loadWeb(lang: string): Promise<CardsDbBytes | null> {
  const base = window.location.origin;
  try {
    const wasm = await fetch(`${base}/cards-db-worker/sqlite3.wasm`);
    if (!wasm.ok) {
      console.log(`[cards-db] sqlite3.wasm unavailable (${wasm.status})`);
      return null;
    }
    const wasmBinary = await wasm.arrayBuffer();

    // A database served from our own origin takes precedence, so the dev
    // server can be pointed at a local build.
    //
    // `ok` cannot be trusted on its own here: a single-page host rewrites any
    // unknown path to index.html and answers 200, so on a deployment that
    // carries no local database this returns a page rather than a file. The
    // header check is what tells them apart — without it the HTML reached the
    // worker and surfaced as "file is not a database".
    const local = await fetch(`${base}/${lang}-database.sqlite`).catch(
      () => null
    );
    if (local && local.ok) {
      const localBytes = await local.arrayBuffer();
      if (isSqliteBytes(localBytes)) {
        return {
          wasmBinary,
          dbBytes: localBytes,
          source: `${base}/${lang}-database.sqlite`,
        };
      }
      console.log(
        "[cards-db] same-origin database is not a SQLite file, ignoring it"
      );
    }

    const db = await fetchDatabaseWeb(lang);
    if (!db) return null;

    return {
      wasmBinary,
      dbBytes: db.bytes,
      source: `${db.source}:${lang}-database.sqlite`,
    };
  } catch (e) {
    console.log("[cards-db] web assets failed to load", e);
    return null;
  }
}

/** Resolves null whenever no database is available, never throws. */
export default async function loadCardsDbBytes(): Promise<CardsDbBytes | null> {
  const lang = (getLocalSetting("lang") || "en").toLowerCase();
  try {
    return electron ? await loadElectron(lang) : await loadWeb(lang);
  } catch (e) {
    console.log("[cards-db] could not load database bytes", e);
    return null;
  }
}
