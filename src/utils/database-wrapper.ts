/* eslint-disable radix */
/* eslint-disable no-console */
import axios from "axios";

import loadDbFromShared from "./loadDbFromCache";
import database from "./mtga/database";
import isTauri from "./tauri/isTauri";

// Cache path will be set asynchronously
let cachePath: string | null = null;

// Initialize cache path for Tauri
async function initCachePath(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    const appData = await appDataDir();
    cachePath = await join(appData, "database.json");
  } catch (e) {
    console.error("Failed to get cache path:", e);
  }
}

// Initialize on module load
initCachePath();

export async function updateCache(data: string): Promise<void> {
  if (!isTauri()) return;

  // Ensure cache path is initialized
  if (!cachePath) {
    await initCachePath();
  }

  if (!cachePath) return;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path: cachePath, contents: data });
    console.log(`Saved metadata to ${cachePath}`);
  } catch (e) {
    console.log(`Error updating cache: ${e}`, "error");
  }
}

async function fileExists(path: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<boolean>("file_exists", { path });
  } catch {
    return false;
  }
}

async function readFile(path: string): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("read_file", { path });
  } catch {
    return null;
  }
}

export async function loadDbFromCache(
  lang?: string,
  forceReload = false
): Promise<void> {
  loadDbFromShared();

  // Ensure cache path is initialized
  if (!cachePath) {
    await initCachePath();
  }

  if (isTauri() && cachePath) {
    const exists = await fileExists(cachePath);
    if (exists) {
      const dbString = await readFile(cachePath);
      if (dbString) {
        database.setDatabase(dbString);
        console.log(`Loaded metadata from cache (${cachePath})`);
      }
    } else {
      console.log(`Cache not found (${cachePath}), try to generate it.`);
      await updateCache(JSON.stringify(database.metadata));
    }
  }

  return axios
    .get(`https://mtgatool.com/api/database/latest/${lang}`)
    .then((latestRes) => {
      if (forceReload || parseInt(latestRes.data.latest) > database.version) {
        return axios
          .get<any>(`https://mtgatool.com/api/database/${lang}`)
          .then((res) => {
            console.log("Updated cards database OK");
            console.log("New DB version: ", latestRes.data.latest);
            database.setDatabaseUnsafely(res.data);
            updateCache(JSON.stringify(res.data));
            return Promise.resolve();
          })
          .catch((e) => {
            console.info(
              "There was a problem updating cards database from https://mtgatool.com/api/database/"
            );
            console.info(e);
            return Promise.resolve();
          });
      }
      console.log(`Database up to date. (v${latestRes.data.latest})`);
      return Promise.resolve();
    })
    .catch((e) => {
      console.info(
        "There was a problem updating cards database from https://mtgatool.com/api/database/latest"
      );
      console.info(e);
      return Promise.resolve();
    });
}

window.database = database;

export default database;
