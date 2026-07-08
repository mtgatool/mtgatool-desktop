import isTauri from "./isTauri";

export async function readFile(path: string): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("read_file", { path });
  }
  throw new Error("File system not available in web mode");
}

export async function writeFile(path: string, contents: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, contents });
    return;
  }
  throw new Error("File system not available in web mode");
}

export async function fileExists(path: string): Promise<boolean> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<boolean>("file_exists", { path });
  }
  return false;
}

export async function getFileSize(path: string): Promise<number> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<number>("get_file_size", { path });
  }
  throw new Error("File system not available in web mode");
}

export async function createDir(path: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("create_dir", { path });
    return;
  }
  throw new Error("File system not available in web mode");
}

export async function deleteFile(path: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_file", { path });
    return;
  }
  throw new Error("File system not available in web mode");
}

export async function getAppDataPath(): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("get_app_data_path");
  }
  throw new Error("App data path not available in web mode");
}

export async function getHomePath(): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("get_home_path");
  }
  throw new Error("Home path not available in web mode");
}
