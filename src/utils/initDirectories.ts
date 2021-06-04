import fs from "fs";
import path from "path";
import electron from "./electron/electronWrapper";

export default function initDirectories() {
  if (electron) {
    const actionLogDir = path.join(
      (electron.app || electron.remote.app).getPath("userData"),
      "actionlogs"
    );
    if (!fs.existsSync(actionLogDir)) {
      fs.mkdirSync(actionLogDir);
    }
  }
}
