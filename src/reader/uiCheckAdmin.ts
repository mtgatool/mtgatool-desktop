import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import isElectron from "../utils/electron/isElectron";

function checkAdmin(): boolean {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");
  const { isAdmin } = reader;
  return isAdmin();
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
