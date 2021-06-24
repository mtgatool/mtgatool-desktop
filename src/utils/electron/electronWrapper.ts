/* eslint-disable no-undef */
import isElectron from "./isElectron";

// eslint-disable-next-line import/no-mutable-exports
let electron: typeof Electron | null = null;
if (isElectron()) {
  // eslint-disable-next-line global-require
  electron = __non_webpack_require__("electron");
}

export default electron;
