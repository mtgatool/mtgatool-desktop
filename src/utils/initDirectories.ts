import path from "path";

import electron from "./electron/electronWrapper";
import remote from "./electron/remoteWrapper";

export default function initDirectories() {
  if (electron) {
    // eslint-disable-next-line global-require
    const fs = require("fs");
    const actionLogDir = path.join(
      (remote && remote.app).getPath("userData"),
      "actionlogs"
    );
    if (!fs.existsSync(actionLogDir)) {
      fs.mkdirSync(actionLogDir);
    }
  }
}
