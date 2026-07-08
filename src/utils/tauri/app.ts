import isTauri from "./isTauri";

export async function getPlatform(): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    return invoke<string>("get_platform");
  }
  return "web";
}

export async function getDefaultLogPath(): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    return invoke<string>("get_default_log_path");
  }
  throw new Error("Log path not available in web mode");
}

export async function restartApp(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("restart_app");
  }
}

export async function quitApp(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("quit_app");
  }
}

/**
 * Relaunch the app elevated (Windows UAC). On accept, the current instance
 * exits and a new elevated one starts; on cancel, this rejects and the app
 * stays open. No-op outside Tauri.
 */
export async function relaunchAsAdmin(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("relaunch_as_admin");
  }
}
