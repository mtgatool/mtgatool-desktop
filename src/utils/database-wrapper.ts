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
  return axios
    .get(`${RELEASE_BASE}/latest.json`)
    .then((latestRes) => {
      if (forceReload || parseInt(latestRes.data.latest) > database.version) {
        return axios
          .get<any>(`${RELEASE_BASE}/${dbLang}-database.json`)
          .then((res) => {
            console.log(
              "Updated cards database. New version:",
              latestRes.data.latest
            );
            database.setDatabaseUnsafely(res.data);
            updateCache(JSON.stringify(res.data));
          })
          .catch((e) => {
            console.info(
              `Problem downloading ${RELEASE_BASE}/${dbLang}-database.json`,
              e
            );
          });
      }
      console.log(`Cards database up to date. (v${latestRes.data.latest})`);
      return undefined;
    })
    .catch((e) => {
      console.info(`Problem checking ${RELEASE_BASE}/latest.json`, e);
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
