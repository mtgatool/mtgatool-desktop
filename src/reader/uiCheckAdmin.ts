import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import isElectron from "../utils/electron/isElectron";
import { getReader } from "../utils/mtgaReader";

function checkAdmin(): boolean {
  return getReader().isAdmin();
}

export default function UICheckAdmin() {
  // if we are on windows
  if (isElectron() && process.platform === "win32") {
    const isAdmin = checkAdmin();
    if (!isAdmin) {
      console.log("Admin detected, sending to overlay");
      reduxAction(store.dispatch, {
        type: "SET_ADMIN_PERMISSIONS",
        arg: false,
      });
    }
  }
}
