import isTauri from "./tauri/isTauri";

// Cache for the log path
let cachedLogPath: string | null = null;

export default function defaultLogUri(): string {
  // Return cached value if available
  if (cachedLogPath !== null) {
    return cachedLogPath;
  }

  // For non-Tauri environments, return empty
  if (!isTauri()) {
    return "";
  }

  // The actual path will be fetched async, return a placeholder for now
  // The caller should use getDefaultLogPathAsync for proper async handling
  return "";
}

// Async version that properly fetches from Tauri backend
export async function getDefaultLogPathAsync(): Promise<string> {
  if (cachedLogPath !== null) {
    return cachedLogPath;
  }

  if (!isTauri()) {
    return "";
  }

  try {
    const { invoke } = await import("@tauri-apps/api/tauri");
    const path = await invoke<string>("get_default_log_path");
    cachedLogPath = path;
    return path;
  } catch (e) {
    console.error("Failed to get default log path:", e);
    return "";
  }
}
