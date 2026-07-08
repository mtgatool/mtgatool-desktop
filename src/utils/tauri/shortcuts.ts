import isTauri from "./isTauri";

export async function registerShortcut(
  shortcut: string,
  eventName: string
): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("register_shortcut", { shortcut, eventName });
  }
}

export async function unregisterShortcut(shortcut: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("unregister_shortcut", { shortcut });
  }
}

export async function unregisterAllShortcuts(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("unregister_all_shortcuts");
  }
}
