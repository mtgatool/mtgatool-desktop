#!/usr/bin/env node
/**
 * Prove the SQL collection query returns exactly what doCollectionFilter does.
 *
 * collectionSql.ts is a translation of doCollectionFilter, and a translation
 * that drifts is the worst kind of bug here: the collection would quietly
 * filter on subtly different rules with nothing throwing. So this runs both
 * over the same real data, for a spread of real query strings, and diffs the
 * resulting rows — id, order, and every field the views read.
 *
 * Both sides are driven by the actual source: the same collectionQuery parser
 * produces the filters, the legacy side runs the real cards worker over
 * database.json, and the SQL side runs against the real .sqlite through the
 * same wasm engine the app uses.
 *
 *   npm run build:workers
 *   node scripts/verify-collection-sql.mjs [db.sqlite] [database.json]
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";


const require = createRequire(import.meta.url);
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(REPO, "dist-verify");

const dbPath = path.resolve(
  process.argv[2] || path.join(REPO, "src/assets/resources/en-database.sqlite")
);
const jsonPath = path.resolve(
  process.argv[3] || path.join(REPO, "src/assets/resources/database.json")
);

/** Query strings covering every filter branch the translator implements. */
const SCENARIOS = [
  "",
  "dragon",
  "goblin",
  "type:creature",
  "type:instant",
  "artist:titov",
  "cmc>=5",
  "cmc<2",
  "cmc=3",
  "rarity:mythic",
  "rarity>=rare",
  "rarity!=common",
  "c:r",
  "c:wu",
  "c=g",
  "c>=br",
  "legal:standard",
  "legal:historic",
  "format:alchemy",
  "banned:standard",
  "suspended:historic",
  "is:craftable",
  "is:booster",
  "-is:booster",
  "s:neo",
  "s:dmu",
  "set:woe",
  "-dragon",
  "dragon type:creature",
  "type:creature cmc<=2 c:g",
  "legal:standard rarity:rare",
  "legal:standard -is:booster cmc>=4",
];

const SORTS = [
  { key: "setCode", sort: -1 },
  { key: "fullName", sort: 1 },
  { key: "cmc", sort: 1 },
  { key: "rarityVal", sort: -1 },
];

/* ------------------------------------------------------------------ compile */

function compile() {
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
    // Type errors are tolerated (strict is off and the tree pulls in .tsx
    // types); what matters is that the JS was emitted.
  }

  const emitted = path.join(OUT, "components/views/collection/collectionSql.js");
  if (!fs.existsSync(emitted)) {
    console.error(`tsc produced no output at ${emitted}`);
    process.exit(1);
  }
}

/**
 * Replace the browser client with one backed directly by the wasm engine.
 * Only the four members collectionSql touches are needed.
 */
function stubClient(lookups) {
  const file = path.join(OUT, "utils/cardsDb/cardsDbClient.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = ${JSON.stringify(lookups)};
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

/* ------------------------------------------------------------------- sqlite */

async function openDb() {
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
  if (rc !== 0) throw new Error(`deserialize failed (${rc})`);

  // The app creates this from the player's collection; empty here, matching the
  // empty collection the legacy side is run with.
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

/* --------------------------------------------------------------------- main */

if (!fs.existsSync(dbPath)) {
  console.error(`No database at ${dbPath}`);
  process.exit(1);
}

console.log(`sqlite: ${dbPath}`);
console.log(`json:   ${jsonPath}\n`);

const { query } = await openDb();

const formats = query("SELECT id, name, word, mask FROM formats ORDER BY id")
  .values.map(([id, name, word, mask]) => ({ id, name, word, mask }));

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

console.log("Compiling the translator and the legacy filter chain …");
compile();
stubClient({
  formats,
  banned: [...banned.entries()],
  suspended: [...suspended.entries()],
});

const { buildCollectionQuery, buildCollectionIdsQuery, rowsToCardsData } = require(
  path.join(OUT, "components/views/collection/collectionSql.js")
);
const getFiltersFromQuery = require(
  path.join(OUT, "components/views/collection/collectionQuery.js")
).default;
const doCollectionFilter = require(
  path.join(OUT, "utils/tables/doCollectionFilter.js")
).default;

console.log("Running the legacy cards worker over database.json …");
const getCollectionData = require(
  path.join(REPO, "dist-cards-worker/cards-worker/getCollectionData.js")
).default;
const dbJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const legacyAll = getCollectionData(
  { prevCards: {}, cards: {} },
  Object.values(dbJson.cards),
  dbJson.cards,
  dbJson.setNames,
  dbJson.sets
);
console.log(`  ${legacyAll.length} rows\n`);

const FIELDS = [
  "id", "cmc", "cid", "fullName", "fullType", "artist", "owned", "acquired",
  "colors", "colorSortVal", "rankSortVal", "rarityVal", "craftable", "booster",
];

function diffRow(a, b) {
  for (const f of FIELDS) {
    const x = a[f];
    const y = b[f];
    if (typeof x === "number" && Number.isNaN(x) && Number.isNaN(y)) continue;
    if (x !== y) return `${f}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`;
  }
  const arrays = ["setCode", "format", "legal", "banned", "suspended"];
  for (const f of arrays) {
    const x = [...(a[f] || [])].sort().join("|");
    const y = [...(b[f] || [])].sort().join("|");
    if (x !== y) return `${f}: ${x} vs ${y}`;
  }
  return null;
}

const _ = require(path.join(REPO, "node_modules/lodash"));

const guardSkippedCases = [];
let failures = 0;
let cases = 0;

for (const sort of SORTS) {
  for (const scenario of SCENARIOS) {
    cases += 1;
    const filters = getFiltersFromQuery(scenario);

    // Filter with the legacy chain, but sort separately.
    //
    // applySort refuses to sort at all when `data[0][key]` is falsy — a cmc of
    // 0 in the first row is enough — so "sort by cmc" is currently a no-op in
    // the app. The SQL path sorts properly, so comparing against the real
    // applySort would report an ordering mismatch on a bug rather than on a
    // translation error. Order is compared against a corrected sort instead,
    // and the scenarios where the guard bites are reported at the end.
    const unsorted = doCollectionFilter(legacyAll, filters, { key: "", sort: 1 });
    const guardSkipped =
      unsorted.length > 0 && sort.key !== "" && !unsorted[0][sort.key];
    if (guardSkipped) guardSkippedCases.push(`${sort.key}: "${scenario}"`);

    const legacy = _.orderBy(
      unsorted,
      [sort.key, "id"],
      [sort.sort === 1 ? "asc" : "desc", "asc"]
    );

    const { sql, params } = buildCollectionQuery(filters, sort);
    const rows = rowsToCardsData(query(sql, params).values);

    const label = `[sort ${sort.key} ${sort.sort}] "${scenario || "(empty)"}"`;

    if (legacy.length !== rows.length) {
      console.log(
        `MISMATCH ${label}\n  count: legacy ${legacy.length} vs sql ${rows.length}`
      );
      const legacyIds = new Set(legacy.map((r) => r.id));
      const sqlIds = new Set(rows.map((r) => r.id));
      const onlyLegacy = [...legacyIds].filter((i) => !sqlIds.has(i)).slice(0, 5);
      const onlySql = [...sqlIds].filter((i) => !legacyIds.has(i)).slice(0, 5);
      if (onlyLegacy.length) console.log(`  only legacy: ${onlyLegacy.join(", ")}`);
      if (onlySql.length) console.log(`  only sql:    ${onlySql.join(", ")}`);
      failures += 1;
      continue;
    }

    // Row-by-row, which checks ordering as well as membership.
    let rowDiff = null;
    for (let i = 0; i < legacy.length; i += 1) {
      if (legacy[i].id !== rows[i].id) {
        rowDiff = `position ${i}: legacy id ${legacy[i].id} vs sql id ${rows[i].id}`;
        break;
      }
      const d = diffRow(legacy[i], rows[i]);
      if (d) {
        rowDiff = `grpid ${legacy[i].id}: ${d}`;
        break;
      }
    }

    if (rowDiff) {
      console.log(`MISMATCH ${label}\n  ${rowDiff}`);
      failures += 1;
      continue;
    }

    // The ids query drives the pager total and the per-set stats.
    const idsQuery = buildCollectionIdsQuery(filters);
    const idRows = query(idsQuery.sql, idsQuery.params).values.map((r) => r[0]);
    if (idRows.length !== legacy.length) {
      console.log(
        `MISMATCH ${label}\n  ids count: ${idRows.length} vs ${legacy.length}`
      );
      failures += 1;
      continue;
    }
    const idSet = new Set(idRows);
    const idMissing = legacy.find((r) => !idSet.has(r.id));
    if (idMissing) {
      console.log(`MISMATCH ${label}\n  ids missing grpid ${idMissing.id}`);
      failures += 1;
      continue;
    }

    // Paged reads must line up with the corresponding slice of the full list.
    const PAGE = 24;
    let pageDiff = null;
    for (const pageIndex of [0, 3, Math.floor(legacy.length / PAGE)]) {
      const offset = pageIndex * PAGE;
      if (offset >= legacy.length && legacy.length > 0) continue;
      const paged = buildCollectionQuery(filters, sort, {
        limit: PAGE,
        offset,
      });
      const pageRows = rowsToCardsData(query(paged.sql, paged.params).values);
      const expected = legacy.slice(offset, offset + PAGE);
      if (pageRows.length !== expected.length) {
        pageDiff = `page ${pageIndex}: ${pageRows.length} rows vs ${expected.length}`;
        break;
      }
      for (let i = 0; i < expected.length; i += 1) {
        if (expected[i].id !== pageRows[i].id) {
          pageDiff = `page ${pageIndex} position ${i}: ${expected[i].id} vs ${pageRows[i].id}`;
          break;
        }
        const d = diffRow(expected[i], pageRows[i]);
        if (d) {
          pageDiff = `page ${pageIndex} grpid ${expected[i].id}: ${d}`;
          break;
        }
      }
      if (pageDiff) break;
    }

    if (pageDiff) {
      console.log(`MISMATCH ${label}\n  ${pageDiff}`);
      failures += 1;
    } else {
      console.log(`ok  ${label.padEnd(52)} ${legacy.length} rows (+ids, +pages)`);
    }
  }
}

console.log(`\n${cases - failures}/${cases} scenarios match.`);
if (guardSkippedCases.length) {
  console.log(
    `\n${guardSkippedCases.length} scenario(s) hit the applySort guard, where the\n` +
      `legacy path silently does not sort at all and SQL does. Sorting is\n` +
      `compared against a corrected sort for those. Affected:`
  );
  [...new Set(guardSkippedCases)].slice(0, 8).forEach((c) => console.log(`  ${c}`));
}
if (failures) process.exitCode = 1;
