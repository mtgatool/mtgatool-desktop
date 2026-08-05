#!/usr/bin/env node
/**
 * Regression tests for the collection search language.
 *
 * Each case is a query string; the expectation is the set of grpids it selects
 * out of the card database, recorded in a golden file. That pins the meaning of
 * the search syntax to something concrete — if a change to the parser or to the
 * SQL builder alters which cards a query returns, this says so and shows which
 * cards moved.
 *
 * This deliberately does not consult the old JSON path. verify-collection-sql
 * proves the two agree today, but the JSON path is going away, and after that
 * these goldens are the only thing standing between a refactor and a silently
 * different search.
 *
 *   node scripts/query-tests.mjs              # check
 *   node scripts/query-tests.mjs --update     # re-record after an intended change
 *
 * The goldens are tied to the database they were recorded against; the file
 * stores its version and this refuses to compare across a different one.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { REPO, DEFAULT_DB, setup, openCardsDb } from "./lib/collection-harness.mjs";

const GOLDEN = path.join(
  REPO,
  "src/components/views/collection/__tests__/collection-queries.golden.json"
);

const update = process.argv.includes("--update");
const dbPath = process.argv.find((a) => a.endsWith(".sqlite")) || DEFAULT_DB;

/**
 * Cases chosen to cover every branch of the query language, and every filter
 * the SQL builder implements. Bugs that have been fixed get a case each, so
 * they cannot come back quietly.
 */
const CASES = [
  // bare text
  "",
  "dragon",
  "goblin",
  "ur-dragon",
  "-dragon", // leading dash negates; used to search for the literal "-dragon"
  "-goblin",
  // types and artists
  "type:creature",
  "type:instant",
  "-type:creature",
  "artist:titov",
  // numeric
  "cmc=3",
  "cmc>=5",
  "cmc<2",
  "-cmc<2",
  // rarity
  "rarity:mythic",
  "rarity>=rare",
  "rarity!=common",
  // colours
  "c:r",
  "c:wu",
  "c=g",
  "c>=br",
  // sets
  "s:neo",
  "s:dmu",
  "set:woe",
  "-s:neo",
  // formats — every one of these was silently dropped before the parser fix
  "legal:standard",
  "legal:historic",
  "legal:alchemy",
  "-legal:standard",
  "format:alchemy",
  "banned:standard",
  "banned:historic",
  "-banned:standard",
  "suspended:historic",
  // booleans — is:booster used to match nothing at all
  "is:craftable",
  "is:booster",
  "in:booster",
  "-is:booster",
  "-in:booster",
  // combinations
  "dragon type:creature",
  "type:creature cmc<=2 c:g",
  "legal:standard rarity:rare",
  "legal:standard in:booster rarity:rare",
  "s:woe rarity:mythic cmc>=6",
];

function digest(ids) {
  return crypto.createHash("sha256").update(ids.join(",")).digest("hex").slice(0, 16);
}

/**
 * Small result sets are stored whole, because seeing the ids is what makes a
 * failure diagnosable. Large ones are stored as a count plus a digest plus a
 * sample — the digest still detects a single card moving.
 */
const INLINE_LIMIT = 60;

function record(ids) {
  const sorted = [...ids].sort((a, b) => a - b);
  if (sorted.length <= INLINE_LIMIT) return { count: sorted.length, ids: sorted };
  return {
    count: sorted.length,
    sha: digest(sorted),
    sample: sorted.slice(0, 10),
  };
}

function compare(expected, actual) {
  if (expected.count !== actual.count) {
    return `count ${actual.count}, expected ${expected.count}`;
  }
  if (expected.ids) {
    const a = expected.ids.join(",");
    const b = actual.ids.join(",");
    if (a !== b) {
      const exp = new Set(expected.ids);
      const got = new Set(actual.ids);
      const added = actual.ids.filter((i) => !exp.has(i)).slice(0, 5);
      const removed = expected.ids.filter((i) => !got.has(i)).slice(0, 5);
      return `same count, different cards — added ${added.join(", ") || "none"}; removed ${removed.join(", ") || "none"}`;
    }
    return null;
  }
  if (expected.sha !== actual.sha) {
    return `same count (${actual.count}) but different cards (digest ${actual.sha} vs ${expected.sha}; first ids ${actual.sample.join(", ")})`;
  }
  return null;
}

const { query, getFiltersFromQuery, buildCollectionIdsQuery } = await setup(
  dbPath
);

// Tie the goldens to the database they describe.
const meta = {};
query("SELECT key, value FROM meta").values.forEach(([k, v]) => {
  meta[k] = v;
});
const dbVersion = `${meta.version}-${meta.language}`;

const results = {};
CASES.forEach((q) => {
  const filters = getFiltersFromQuery(q);
  const { sql, params } = buildCollectionIdsQuery(filters);
  const ids = query(sql, params).values.map((r) => r[0]);
  results[q] = record(ids);
});

if (update) {
  fs.mkdirSync(path.dirname(GOLDEN), { recursive: true });
  fs.writeFileSync(
    GOLDEN,
    `${JSON.stringify({ dbVersion, cases: results }, null, 2)}\n`
  );
  console.log(
    `Recorded ${CASES.length} cases against database ${dbVersion}\n  ${path.relative(REPO, GOLDEN)}`
  );
  process.exit(0);
}

if (!fs.existsSync(GOLDEN)) {
  console.error(
    `No golden file at ${path.relative(REPO, GOLDEN)}.\n` +
      `Record one with: node scripts/query-tests.mjs --update`
  );
  process.exit(1);
}

const golden = JSON.parse(fs.readFileSync(GOLDEN, "utf8"));

if (golden.dbVersion !== dbVersion) {
  console.error(
    `Golden file was recorded against database ${golden.dbVersion}, but this ` +
      `one is ${dbVersion}.\nA newer card database legitimately changes which ` +
      `cards a query returns. Re-record with --update, and read the diff.`
  );
  process.exit(1);
}

let failures = 0;
const missing = [];

CASES.forEach((q) => {
  const expected = golden.cases[q];
  const actual = results[q];
  const label = `"${q || "(empty)"}"`;

  if (!expected) {
    missing.push(q);
    console.log(`new  ${label.padEnd(42)} ${actual.count} rows (not in goldens)`);
    return;
  }

  const diff = compare(expected, actual);
  if (diff) {
    console.log(`FAIL ${label.padEnd(42)} ${diff}`);
    failures += 1;
  } else {
    console.log(`ok   ${label.padEnd(42)} ${actual.count} rows`);
  }
});

const stale = Object.keys(golden.cases).filter((q) => !CASES.includes(q));

console.log(
  `\n${CASES.length - failures - missing.length}/${CASES.length} cases match ` +
    `(database ${dbVersion}).`
);
if (missing.length) {
  console.log(`${missing.length} case(s) have no golden yet — run with --update.`);
}
if (stale.length) {
  console.log(`${stale.length} golden(s) no longer have a case: ${stale.join(", ")}`);
}
if (failures || missing.length) process.exitCode = 1;
