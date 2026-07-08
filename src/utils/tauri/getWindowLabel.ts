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
    // Tauri injects per-window metadata before scripts run; this is what
    // appWindow.label reads from. The old window.__TAURI__.window.appWindow
    // path was undefined in this build and wrongly returned "main".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (window as any).__TAURI_METADATA__;
    return meta?.__currentWindow?.label || WINDOW_MAIN;
  }
  return WINDOW_MAIN;
}
