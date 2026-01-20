/* eslint-disable no-nested-ternary */
import isTauri from "./tauri/isTauri";

export default function getPopupClass(os: string) {
  return isTauri()
    ? os === "linux"
      ? "electron-popup-notop"
      : "electron-popup"
    : "";
}
