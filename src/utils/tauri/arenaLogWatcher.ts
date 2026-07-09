import isTauri from "./isTauri";

export interface LogChunkPayload {
  text: string;
  position: number;
  size: number;
}

let unlisten: (() => void) | null = null;
let unlistenFinished: (() => void) | null = null;

export async function startLogWatcher(
  path: string,
  onChunk: (payload: LogChunkPayload) => void,
  onFinished?: () => void
): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    const { listen } = await import("@tauri-apps/api/event");

    // Set up event listeners first
    unlisten = await listen<LogChunkPayload>("log_chunk", (event) => {
      // eslint-disable-next-line no-console
      console.log("[log] chunk received", event.payload?.text?.length, "bytes");
      onChunk(event.payload);
    });

    // Fired once when the initial (historical) read has caught up.
    unlistenFinished = await listen("log_finished", () => {
      // eslint-disable-next-line no-console
      console.log("[log] initial read finished");
      if (onFinished) onFinished();
    });

    // Start the watcher
    await invoke("start_log_watcher", { path });
  }
}

export async function stopLogWatcher(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("stop_log_watcher");
  }

  if (unlisten) {
    unlisten();
    unlisten = null;
  }
  if (unlistenFinished) {
    unlistenFinished();
    unlistenFinished = null;
  }
}
