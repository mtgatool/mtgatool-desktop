/* eslint-disable radix */
/* eslint-disable no-console */
import path from "path";
import { app, remote } from "electron";
import fs from "fs";
import _ from "lodash";
import { database } from "mtgatool-shared";
import axios from "axios";

// import distributedDb from "../assets/resources/database.json";

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
      console.log(`Saved metadata to ${cachePath}`);
      fs.writeFileSync(cachePath, data);
    }
  } catch (e) {
    console.log(`Error updating cache: ${e}`, "error");
  }
}

export function loadDbFromCache(): void {
  if (cachePath && fs.existsSync(cachePath)) {
    const dbString = fs.readFileSync(cachePath, "utf8");
    database.setDatabase(dbString);
    console.log(`Loaded metadata from cache (${cachePath})`);
  } else {
    console.log(`Cache not found (${cachePath}), try to generate it.`);
    // database.setDatabaseUnsafely(distributedDb as Metadata);
    updateCache(JSON.stringify(database.metadata));
  }

  axios
    .get("https://mtgatool.com/database/latest/")
    .then((latestRes) => {
      console.log(latestRes);
      if (parseInt(latestRes.data.latest) > database.version) {
        axios
          .get<any>("https://mtgatool.com/database/")
          .then((res) => {
            database.setDatabaseUnsafely(res.data);
            updateCache(JSON.stringify(res.data));
          })
          .catch((e) => {
            console.info(
              "There was a problem updating cards database from https://mtgatool.com/database/"
            );
            console.info(e);
          });
      }
    })
    .catch((e) => {
      console.info(
        "There was a problem updating cards database from https://mtgatool.com/database/latest"
      );
      console.info(e);
    });
}

export default database;
