import isTauri from "./isTauri";

export async function closeWindow(): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.close();
  }
}

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.minimize();
  }
}

export async function hideWindow(): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.hide();
  }
}

export async function showWindow(): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.show();
  }
}

export async function toggleMaximize(): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.toggleMaximize();
  }
}

export async function setMaximize(maximize: boolean): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    if (maximize) {
      await appWindow.maximize();
    } else {
      await appWindow.unmaximize();
    }
  }
}

export async function isMaximized(): Promise<boolean> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    return appWindow.isMaximized();
  }
  return false;
}

export async function isFocused(): Promise<boolean> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    return appWindow.isFocused();
  }
  return true;
}

export async function setAlwaysOnTop(onTop: boolean): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.setAlwaysOnTop(onTop);
  }
}

export async function setResizable(resizable: boolean): Promise<void> {
  if (isTauri()) {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    await appWindow.setResizable(resizable);
  }
}

export async function setIgnoreCursorEvents(ignore: boolean): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_ignore_cursor_events", { ignore });
  }
}

export async function setFocusable(_focusable: boolean): Promise<void> {
  // Tauri doesn't have a direct setFocusable API
  // This is handled at window creation time
  // For overlays, we use setIgnoreCursorEvents instead
}
