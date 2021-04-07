/* eslint-disable */ 
import fs from "fs";
import path from "path";
import format from "date-fns/format";
import { app, remote } from "electron";
import globalStore from "./store";

let currentActionLog = "";

const actionLogDir = path.join(
  (app || remote.app).getPath("userData"),
  "actionlogs"
);

const actionLog = (
  seat: number,
  time = new Date(),
  str: string,
  _grpId = 0
): void => {
  if (seat == -99) {
    currentActionLog = "version: 1\r\n";
  } else {
    // str = str.replace(/(<([^>]+)>)/gi, "");

    currentActionLog += `${seat}\r\n`;
    currentActionLog += `${format(time, "HH:mm:ss")}\r\n`;
    currentActionLog += `${str}\r\n`;

    /*
    try {
      fs.writeFileSync(
        path.join(actionLogDir, `${globalStore.currentMatch.matchId}.txt`),
        currentActionLog,
        "utf-8"
      );
    } catch (e) {
      console.error("Could not write action log data");
      console.error(e);
    }
    */
  }
};

export default actionLog;
