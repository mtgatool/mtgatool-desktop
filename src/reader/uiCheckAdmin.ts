import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { isAdmin, isMemoryReadingAvailable } from "../utils/mtgaReader";

export default async function UICheckAdmin() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  // MTGA runs elevated, so the app must too or every memory read fails
  // silently (empty account/collection/decks). Surface that as the admin
  // warning. The old `process.platform === "win32"` guard never matched in
  // the Tauri webview, so this check never actually ran.
  const admin = await isAdmin();
  reduxAction(store.dispatch, {
    type: "SET_ADMIN_PERMISSIONS",
    arg: admin,
  });
}
