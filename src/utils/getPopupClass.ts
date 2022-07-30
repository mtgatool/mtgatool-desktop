/* eslint-disable no-nested-ternary */
import isElectron from "./electron/isElectron";

export default function getPopupClass(os: string) {
  return isElectron()
    ? os === "linux"
      ? "electron-popup-notop"
      : "electron-popup"
    : "";
}
