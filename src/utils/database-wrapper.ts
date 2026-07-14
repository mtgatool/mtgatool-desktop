/* eslint-disable radix */
/* eslint-disable no-console */
import axios from "axios";
import _ from "lodash";

import electron from "./electron/electronWrapper";
import remote from "./electron/remoteWrapper";
import loadDbFromShared from "./loadDbFromCache";
import database from "./mtga/database";

// import distributedDb from "../assets/resources/database.json";

let cachePath: string | null = null;
if (electron) {
  // eslint-disable-next-line no-undef
  const path = __non_webpack_require__("path");
  cachePath = remote
    ? path.join(remote.app.getPath("userData"), "database.json")
    : null;
}

/*
 This is cool for debugging the metadata files, so we can
 test and view the output files without copypasta.
*/
/*
const cachePath =
  app || (remote && remote.app)
    ? path.join(
        "C:\\Users\\user\\Documents\\GitHub\\MTG-Arena-Tool-Metadata\\dist",
        "v67-en-database.json"
      )
    : null;

const scryfallDataPath = path.join(
  "C:\\Users\\user\\Documents\\GitHub\\MTG-Arena-Tool-Metadata\\external",
  "scryfall-cards.json"
);
*/

export function updateCache(data: string): void {
  if (electron) {
    try {
      // eslint-disable-next-line no-undef
      const fs = __non_webpack_require__("fs");
      if (cachePath) {
        console.log(`Saved metadata to ${cachePath}`);
        fs.writeFileSync(cachePath, data);
      }
    } catch (e) {
      console.log(`Error updating cache: ${e}`, "error");
    }
  } else {
    // requests are cached so we are cool?
  }
}

// Metadata is served from GitHub Releases (the old mtgatool.com/api route is
// being sunset). `releases/latest/download/…` always resolves to the newest
// published release. latest.json = { latest, updated }; the per-language DB is
// `${lang}-database.json`.
const RELEASE_BASE =
  "https://github.com/mtgatool/mtgatool-metadata/releases/latest/download";

/**
 * Fetch a GitHub Release asset as text. In Electron we MUST use Node's https
 * from the renderer's node context — a renderer XHR/fetch to github.com is
 * blocked by CORS (release assets don't send Access-Control-Allow-Origin).
 * Node networking isn't subject to CORS. Follows the redirect chain
 * (github.com -> objects.githubusercontent.com) and handles gzip.
 */
function fetchReleaseText(url: string): Promise<string> {
  if (!electron) {
    // Web build: best-effort XHR (needs a CORS-enabled host to actually work).
    return axios
      .get(url, { responseType: "text", transformResponse: [(d) => d] })
      .then((r) => r.data as string);
  }

  // eslint-disable-next-line no-undef
  const https = __non_webpack_require__("https");
  // eslint-disable-next-line no-undef
  const zlib = __non_webpack_require__("zlib");

  return new Promise<string>((resolve, reject) => {
    const get = (u: string, redirects: number): void => {
      https
        .get(
          u,
          {
            headers: {
              "User-Agent": "mtgatool-desktop",
              "Accept-Encoding": "gzip",
            },
          },
          (res: any) => {
            const status = res.statusCode || 0;
            if (
              status >= 300 &&
              status < 400 &&
              res.headers.location &&
              redirects < 6
            ) {
              res.resume();
              get(res.headers.location, redirects + 1);
              return;
            }
            if (status !== 200) {
              res.resume();
              reject(new Error(`HTTP ${status} for ${u}`));
              return;
            }
            const stream =
              res.headers["content-encoding"] === "gzip"
                ? res.pipe(zlib.createGunzip())
                : res;
            stream.setEncoding("utf8");
            let data = "";
            stream.on("data", (c: string) => {
              data += c;
            });
            stream.on("end", () => resolve(data));
            stream.on("error", reject);
          }
        )
        .on("error", reject);
    };
    get(url, 0);
  });
}

/**
 * Check GitHub Releases for a newer card database and download it if the
 * published version is greater than the one currently loaded (or forceReload).
 * Version-gated, so it only transfers the ~24MB payload when there's actually a
 * newer release — otherwise it's just a tiny latest.json check. Never throws.
 */
export function syncCardDatabase(
  lang?: string,
  forceReload = false
): Promise<void> {
  const dbLang = lang || "en";
  return fetchReleaseText(`${RELEASE_BASE}/latest.json`)
    .then((latestText) => {
      const latest = JSON.parse(latestText);
      if (forceReload || parseInt(latest.latest) > database.version) {
        return fetchReleaseText(`${RELEASE_BASE}/${dbLang}-database.json`).then(
          (dbText) => {
            console.log("Updated cards database. New version:", latest.latest);
            database.setDatabaseUnsafely(JSON.parse(dbText));
            updateCache(dbText);
          }
        );
      }
      console.log(`Cards database up to date. (v${latest.latest})`);
      return undefined;
    })
    .catch((e) => {
      console.info(`Problem syncing cards database from ${RELEASE_BASE}`, e);
    });
}

export function loadDbFromCache(
  lang?: string,
  forceReload = false
): Promise<void> {
  loadDbFromShared();
  if (electron) {
    // eslint-disable-next-line no-undef
    const fs = __non_webpack_require__("fs");
    if (cachePath && fs.existsSync(cachePath)) {
      const dbString = fs.readFileSync(cachePath, "utf8");
      database.setDatabase(dbString);
      console.log(`Loaded metadata from cache (${cachePath})`);
    } else {
      console.log(`Cache not found (${cachePath}), try to generate it.`);
      // database.setDatabaseUnsafely(distributedDb as Metadata);
      updateCache(JSON.stringify(database.metadata));
    }
  } else {
    // requests are cached so we are cool?
  }

  return syncCardDatabase(lang, forceReload);
}

// Periodic background sync so a long-running app picks up a freshly published
// release without needing a restart. Idempotent — only one timer runs.
let autoSyncTimer: ReturnType<typeof setInterval> | null = null;
const AUTO_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function startCardDatabaseAutoSync(lang?: string): void {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(() => {
    syncCardDatabase(lang).catch(() => undefined);
  }, AUTO_SYNC_INTERVAL_MS);
}

window.database = database;

export default database;
