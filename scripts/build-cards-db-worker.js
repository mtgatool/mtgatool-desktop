#!/usr/bin/env node
/**
 * Build the card database worker into public/cards-db-worker/.
 *
 * Unlike the older cards worker this is NOT browserified. The worker is loaded
 * as an ES module and imports the SQLite wasm glue as a sibling file, so all
 * this has to do is compile the TypeScript to ESM and copy two files out of
 * node_modules:
 *
 *   sqlite3.mjs   - @sqlite.org/sqlite-wasm's browser entry point
 *   sqlite3.wasm  - the engine
 *
 * The .wasm is copied for reference and for the web build; in Electron the
 * window reads it with fs and transfers the bytes in, because a worker under
 * `file://` has no Node and cannot be trusted to fetch it. See the header of
 * src/cards-db-worker/worker.ts.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const OUT = path.join(REPO, "public/cards-db-worker");
const PKG = path.join(REPO, "node_modules/@sqlite.org/sqlite-wasm/dist");

const COPIES = [
  ["index.mjs", "sqlite3.mjs"],
  ["sqlite3.wasm", "sqlite3.wasm"],
];

function main() {
  if (!fs.existsSync(PKG)) {
    console.error(
      `@sqlite.org/sqlite-wasm is not installed (looked in ${PKG}).\n` +
        `Run npm install first.`
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  COPIES.forEach(([from, to]) => {
    const src = path.join(PKG, from);
    if (!fs.existsSync(src)) {
      console.error(`Missing ${src} — did @sqlite.org/sqlite-wasm change its layout?`);
      process.exit(1);
    }
    fs.copyFileSync(src, path.join(OUT, to));
    const size = (fs.statSync(path.join(OUT, to)).size / 1024).toFixed(0);
    console.log(`  copied ${to} (${size} KB)`);
  });

  console.log("  compiling worker …");
  // Run the compiler's entry point with the current node rather than the
  // node_modules/.bin shim: on Windows that shim is tsc.cmd, which execFileSync
  // cannot launch without a shell. This works the same everywhere and needs no
  // shell at all.
  execFileSync(
    process.execPath,
    [
      path.join(REPO, "node_modules", "typescript", "bin", "tsc"),
      "-p",
      path.join(REPO, "cards-db-worker-tsconfig.json"),
    ],
    { stdio: "inherit" }
  );

  const built = path.join(OUT, "worker.js");
  if (!fs.existsSync(built)) {
    console.error(`Expected ${built} to exist after tsc.`);
    process.exit(1);
  }
  console.log(`  built ${path.relative(REPO, built)}`);
}

main();
