import isElectron from "./isElectron";

// eslint-disable-next-line import/no-mutable-exports
let electron: typeof Electron | null = null;
if (isElectron()) {
  // eslint-disable-next-line global-require
  electron = require("electron");
}

export default electron;
