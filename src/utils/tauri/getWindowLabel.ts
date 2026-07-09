import { WINDOW_MAIN } from "../../types/app";
import isTauri from "./isTauri";

export default async function getWindowLabel(): Promise<string> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    return appWindow.label;
  }
  return WINDOW_MAIN;
}

export function getWindowLabelSync(): string {
  if (isTauri()) {
    try {
      // Tauri v2 exposes the current window label synchronously via
      // getCurrentWindow(). The old __TAURI_METADATA__ global is v1-only
      // (undefined in v2) and wrongly returned "main" for every window.
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      const { getCurrentWindow } = require("@tauri-apps/api/window");
      return getCurrentWindow().label || WINDOW_MAIN;
    } catch {
      return WINDOW_MAIN;
    }
  }
  return WINDOW_MAIN;
}
