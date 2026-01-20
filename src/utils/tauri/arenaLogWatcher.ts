import isTauri from "./isTauri";

export interface LogChunkPayload {
  text: string;
  position: number;
  size: number;
}

let unlisten: (() => void) | null = null;

export async function startLogWatcher(
  path: string,
  onChunk: (payload: LogChunkPayload) => void
): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    const { listen } = await import("@tauri-apps/api/event");

    // Set up event listener first
    unlisten = await listen<LogChunkPayload>("log_chunk", (event) => {
      onChunk(event.payload);
    });

    // Start the watcher
    await invoke("start_log_watcher", { path });
  }
}

export async function stopLogWatcher(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    await invoke("stop_log_watcher");
  }

  if (unlisten) {
    unlisten();
    unlisten = null;
  }
}
