/**
 * Shared rig for running the collection's real query pipeline outside the app.
 *
 * The pipeline is TypeScript that imports browser-only modules, so it is
 * compiled to CommonJS in a scratch directory and the SQLite client is swapped
 * for one backed directly by the wasm engine. That gives a plain Node harness
 * running the *actual* parser, the *actual* SQL builder and the *actual*
 * engine, rather than a reimplementation that can drift from any of them.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const REPO = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
export const OUT = path.join(REPO, "dist-verify");

export const DEFAULT_DB = path.join(
  REPO,
  "src/assets/resources/en-database.sqlite"
);

/** Compile the parser, the SQL builder and the legacy filter chain to CJS. */
export function compileCollection() {
  const tsconfig = path.join(OUT, "tsconfig.json");
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        target: "ES2019",
        module: "commonjs",
        moduleResolution: "node",
        outDir: ".",
        rootDir: "../src",
        strict: false,
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        noEmitOnError: false,
      },
      include: [
        "../src/components/views/collection/collectionQuery.ts",
        "../src/components/views/collection/collectionSql.ts",
        "../src/utils/tables/doCollectionFilter.ts",
      ],
    })
  );

  try {
    execFileSync(path.join(REPO, "node_modules/.bin/tsc"), ["-p", tsconfig], {
      stdio: "pipe",
    });
  } catch (e) {
    // Type errors are tolerated — strict is off and the tree pulls in .tsx
    // types it cannot see. What matters is that the JS was emitted.
  }

  const emitted = path.join(OUT, "components/views/collection/collectionSql.js");
  if (!fs.existsSync(emitted)) {
    throw new Error(`tsc produced no output at ${emitted}`);
  }
}

/** Open a card database and return a `query(sql, params)` over it. */
export async function openCardsDb(dbPath) {
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `No database at ${dbPath}\n` +
        `Build one from mtgatool-metadata:\n` +
        `  npm run sqlite -- ../mtgatool-desktop/src/assets/resources/database.json \\\n` +
        `    ../mtgatool-desktop/src/assets/resources/en-database.sqlite`
    );
  }

  const { default: init } = await import("@sqlite.org/sqlite-wasm");
  const sqlite3 = await init({ print: () => {}, printErr: () => {} });
  const db = new sqlite3.oo1.DB();
  const bytes = new Uint8Array(fs.readFileSync(dbPath));
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
  if (rc !== 0) throw new Error(`sqlite3_deserialize failed (${rc})`);

  // The app fills this from the player's collection. Left empty here so runs
  // are reproducible and independent of whoever's account is on the machine.
  db.exec(`CREATE TEMP TABLE collection (
    grpid INTEGER PRIMARY KEY, owned INTEGER DEFAULT 0, prev INTEGER DEFAULT 0)`);

  const query = (sql, params = []) => {
    const columns = [];
    const values = [];
    db.exec({
      sql,
      bind: params.length ? params : undefined,
      rowMode: "array",
      columnNames: columns,
      callback: (row) => values.push(row),
    });
    return { columns, values };
  };

  return { db, query };
}

/** The reference tables cardsDbClient normally caches at init. */
export function readLookups(query) {
  const formats = query(
    "SELECT id, name, word, mask FROM formats ORDER BY id"
  ).values.map(([id, name, word, mask]) => ({ id, name, word, mask }));

  const banned = new Map();
  const suspended = new Map();
  query(
    `SELECT f.name, fc.title_id, fc.kind FROM format_cards fc
       JOIN formats f ON f.id = fc.format_id
      WHERE fc.kind IN ('banned','suspended')`
  ).values.forEach(([name, titleId, kind]) => {
    const bag = kind === "banned" ? banned : suspended;
    if (bag.has(titleId)) bag.get(titleId).push(name);
    else bag.set(titleId, [name]);
  });

  return { formats, banned, suspended };
}

/** Replace the browser client with one collectionSql can use directly. */
export function installClientStub({ formats, banned, suspended }) {
  const file = path.join(OUT, "utils/cardsDb/cardsDbClient.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = ${JSON.stringify({
      formats,
      banned: [...banned.entries()],
      suspended: [...suspended.entries()],
    })};
exports.default = {
  available: true,
  formats: data.formats,
  formatByName: new Map(data.formats.map((f) => [f.name.toLowerCase(), f])),
  bannedByTitle: new Map(data.banned),
  suspendedByTitle: new Map(data.suspended),
  decodeFormats(words) {
    return data.formats
      .filter((f) => (words[f.word] & f.mask) !== 0)
      .map((f) => f.name);
  },
};
`
  );
}

/** Load the compiled pipeline. Call after compileCollection + installClientStub. */
export function loadPipeline() {
  const collectionSql = require(
    path.join(OUT, "components/views/collection/collectionSql.js")
  );
  return {
    getFiltersFromQuery: require(
      path.join(OUT, "components/views/collection/collectionQuery.js")
    ).default,
    doCollectionFilter: require(
      path.join(OUT, "utils/tables/doCollectionFilter.js")
    ).default,
    buildCollectionQuery: collectionSql.buildCollectionQuery,
    buildCollectionIdsQuery: collectionSql.buildCollectionIdsQuery,
    rowsToCardsData: collectionSql.rowsToCardsData,
  };
}

/** Everything set up in one call. */
export async function setup(dbPath = DEFAULT_DB) {
  const { query } = await openCardsDb(dbPath);
  const lookups = readLookups(query);
  compileCollection();
  installClientStub(lookups);
  return { query, lookups, ...loadPipeline() };
}
