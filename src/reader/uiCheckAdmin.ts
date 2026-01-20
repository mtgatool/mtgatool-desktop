import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import isTauri from "../utils/tauri/isTauri";

function checkAdmin(): boolean {
  // In Tauri, native modules aren't available in the browser context
  if (isTauri()) {
    // TODO: Implement via Tauri command
    return false;
  }

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");
    const { isAdmin } = reader;
    return isAdmin();
  } catch (error) {
    console.error("Failed to access mtga-reader:", error);
    return false;
  }
}

export default function UICheckAdmin() {
  // Skip in Tauri - native module access not available
  if (isTauri()) {
    return;
  }

  // if we are on windows
  if (process.platform === "win32") {
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
