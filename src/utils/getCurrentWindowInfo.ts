import { PhysicalSize } from "@tauri-apps/api/dpi";

import { getOverlayIndexFromLabel } from "../types/app";
import isTauri from "./tauri/isTauri";

// Get current overlay ID regardless of platform
export function getCurrentOverlayId(): number {
  if (isTauri()) {
    // In Tauri v2, the current window label is read synchronously.
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { getCurrentWindow } = require("@tauri-apps/api/window");
    const label = getCurrentWindow().label || "";
    return getOverlayIndexFromLabel(label);
  }

  return 0;
}

// Get current window label/title
export function getCurrentWindowLabel(): string {
  if (isTauri()) {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { getCurrentWindow } = require("@tauri-apps/api/window");
    return getCurrentWindow().label || "main";
  }

  return "";
}

// Get current window bounds
export async function getCurrentWindowBounds(): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null> {
  if (isTauri()) {
    try {
      const appWindow = (
        await import("@tauri-apps/api/window")
      ).getCurrentWindow();
      const position = await appWindow.outerPosition();
      const size = await appWindow.outerSize();
      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// Set window bounds (height only for autosize)
export async function setCurrentWindowHeight(height: number): Promise<void> {
  if (isTauri()) {
    try {
      const appWindow = (
        await import("@tauri-apps/api/window")
      ).getCurrentWindow();
      const size = await appWindow.outerSize();
      await appWindow.setSize(new PhysicalSize(size.width, Math.ceil(height)));
    } catch (e) {
      console.error("Failed to set window height:", e);
    }
  }
}

// Listen for window move/resize events
export async function onWindowMoveResize(
  callback: () => void
): Promise<() => void> {
  if (isTauri()) {
    try {
      const appWindow = (
        await import("@tauri-apps/api/window")
      ).getCurrentWindow();
      const unlistenMove = await appWindow.onMoved(callback);
      const unlistenResize = await appWindow.onResized(callback);
      return () => {
        unlistenMove();
        unlistenResize();
      };
    } catch {
      return () => {};
    }
  }

  return () => {};
}
