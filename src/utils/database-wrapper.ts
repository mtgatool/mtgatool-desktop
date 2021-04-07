/* eslint-disable no-console */
import path from "path";
import { app, remote } from "electron";
import fs from "fs";
import _ from "lodash";
import { database } from "mtgatool-shared";

import { Metadata } from "mtgatool-shared/dist/types";
import debugLog from "./debugLog";

import distributedDb from "../assets/resources/database.json";

const cachePath: string | null =
  app || (remote && remote.app)
    ? path.join((app || remote.app).getPath("userData"), "database.json")
    : null;

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
  try {
    if (cachePath) {
      debugLog(`Saved metadata to ${cachePath}`);
      fs.writeFileSync(cachePath, data);
    }
  } catch (e) {
    debugLog(`Error updating cache: ${e}`, "error");
  }
}

export function loadDbFromCache(): void {
  if (cachePath && fs.existsSync(cachePath)) {
    const dbString = fs.readFileSync(cachePath, "utf8");
    database.setDatabase(dbString);
    console.log(`Loaded metadata from cache (${cachePath})`);
  } else {
    console.log(`Cache not found (${cachePath}), try to generate it.`);
    database.setDatabaseUnsafely(distributedDb as Metadata);
    updateCache(JSON.stringify(distributedDb));
  }
}

export default database;
