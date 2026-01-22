import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { isAdmin, isMemoryReadingAvailable } from "../utils/mtgaReader";

export default async function UICheckAdmin() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) {
    return;
  }

  // if we are on windows
  if (typeof process !== "undefined" && process.platform === "win32") {
    const admin = await isAdmin();
    if (!admin) {
      console.log("Admin detected, sending to overlay");
      reduxAction(store.dispatch, {
        type: "SET_ADMIN_PERMISSIONS",
        arg: false,
      });
    }
  }
}
