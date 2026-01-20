import { getOverlayIndexFromLabel } from "../types/app";
import isTauri from "./tauri/isTauri";

// Get current overlay ID regardless of platform
export function getCurrentOverlayId(): number {
  if (isTauri()) {
    // In Tauri, we use the window label
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (window as any).__TAURI__?.window?.appWindow?.label || "";
    return getOverlayIndexFromLabel(label);
  }

  return 0;
}

// Get current window label/title
export function getCurrentWindowLabel(): string {
  if (isTauri()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__TAURI__?.window?.appWindow?.label || "main";
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
      const { appWindow } = await import("@tauri-apps/api/window");
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
      const { appWindow } = await import("@tauri-apps/api/window");
      const size = await appWindow.outerSize();
      await appWindow.setSize({
        type: "Physical",
        width: size.width,
        height: Math.ceil(height),
      });
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
      const { appWindow } = await import("@tauri-apps/api/window");
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
