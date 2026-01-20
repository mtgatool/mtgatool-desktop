import isTauri from "./isTauri";

export interface OverlayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function createOverlayWindow(
  label: string,
  bounds: OverlayBounds,
  transparent: boolean
): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("create_overlay_window", {
      label,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      transparent,
    });
  }
}

export async function closeOverlayWindow(label: string): Promise<void> {
  if (isTauri()) {
    const { WebviewWindow } = await import("@tauri-apps/api/window");
    const window = WebviewWindow.getByLabel(label);
    if (window) {
      await window.close();
    }
  }
}

export async function getAllOverlayWindows(): Promise<string[]> {
  if (isTauri()) {
    const { getAll } = await import("@tauri-apps/api/window");
    const windows = await getAll();
    return windows
      .filter((w) => w.label.startsWith("overlay-"))
      .map((w) => w.label);
  }
  return [];
}

export async function getWindowBounds(
  label?: string
): Promise<OverlayBounds | null> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    try {
      return await invoke<OverlayBounds>("get_window_bounds", { label });
    } catch {
      return null;
    }
  }
  return null;
}

export async function setWindowBounds(
  bounds: OverlayBounds,
  label?: string
): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("set_window_bounds", {
      label,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }
}
