import isTauri from "./isTauri";
import { WINDOW_MAIN } from "../../types/app";

export default async function getWindowLabel(): Promise<string> {
  if (isTauri()) {
    const { appWindow } = await import("@tauri-apps/api/window");
    return appWindow.label;
  }
  return WINDOW_MAIN;
}

export function getWindowLabelSync(): string {
  if (isTauri()) {
    // In Tauri, we can access the label synchronously through the window object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tauriWindow = (window as any).__TAURI__?.window;
    if (tauriWindow) {
      return tauriWindow.appWindow?.label || WINDOW_MAIN;
    }
  }
  return WINDOW_MAIN;
}
