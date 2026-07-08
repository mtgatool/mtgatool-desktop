import isTauri from "./tauri/isTauri";

export default async function initDirectories(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const { appDataDir, join } = await import("@tauri-apps/api/path");

    const appData = await appDataDir();
    const actionLogDir = await join(appData, "actionlogs");

    // Create directory using Tauri command
    await invoke("create_dir", { path: actionLogDir });
  } catch (e) {
    console.error("Failed to initialize directories:", e);
  }
}
