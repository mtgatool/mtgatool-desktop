import ArenaLogDecoder from "../background/arena-log-decoder/arena-log-decoder";
import logEntrySwitch from "../background/logEntrySwitch";
import { getLogMode, LogMode, setLogMode } from "../background/logReadState";
import bcConnect from "../utils/bcConnect";
import { pushDebug } from "../utils/debugLog";
import getLocalSetting from "../utils/getLocalSetting";
import setLocalSetting from "../utils/setLocalSetting";
import { getDefaultLogPath } from "../utils/tauri/app";
import {
  LogChunkPayload,
  startLogWatcher,
  stopLogWatcher,
} from "../utils/tauri/arenaLogWatcher";
import { ChannelMessage } from "./channelMessages";
import postChannelMessage from "./postChannelMessage";

export default function backgroundChannelListenersTauri() {
  const channel = bcConnect() as BroadcastChannel;

  let decoder = ArenaLogDecoder();
  let isWatching = false;
  // Throttles the cross-window progress notification. Posting one per log entry
  // and broadcasting it to every window flooded WebView2's IPC queue on the
  // initial read (0x80070718 "not enough quota"). The main window only uses
  // this for a progress %, which it already throttles to 333ms on receipt.
  let lastProgressPost = 0;

  // Handle log chunks from Rust watcher
  const handleLogChunk = (payload: LogChunkPayload) => {
    const { text, position, size } = payload;

    let entryCount = 0;
    decoder.append(text, (entry: any) => {
      entryCount += 1;
      // Route the entry to the label handlers (scene change, player id,
      // matches, rank, ...). This is what drives everything downstream; it
      // was missing from the Tauri log path.
      try {
        logEntrySwitch(entry);
      } catch (e) {
        console.error("logEntrySwitch error:", e);
      }

      // Progress notification only (json stripped), throttled to ~3/s.
      const now = Date.now();
      if (now - lastProgressPost > 333) {
        lastProgressPost = now;
        postChannelMessage({
          type: "LOG_MESSAGE_RECV",
          value: { ...entry, position, size, json: {} },
        });
      }
    });
    pushDebug(
      `[bg] log chunk ${text.length}b @${position}/${size} → ${entryCount} entries`
    );

    // Notify about log check
    postChannelMessage({
      type: "LOG_CHECK",
    });
  };

  // Set the reader mode (background source of truth) and mirror it to the main
  // window so the UI + main-side gating (cloud push, scene-driven memory reads)
  // follow along.
  const applyMode = (mode: LogMode): void => {
    setLogMode(mode);
    postChannelMessage({ type: "LOG_MODE", value: mode });
  };

  const startWatching = async (): Promise<void> => {
    if (isWatching) return;

    // Reset decoder + progress throttle for a fresh read.
    decoder = ArenaLogDecoder();
    lastProgressPost = 0;

    // Get log path
    let logPath = getLocalSetting("logPath");
    if (!logPath || logPath.indexOf("undefined/") > -1) {
      try {
        logPath = await getDefaultLogPath();
        setLocalSetting("logPath", logPath);
      } catch (e) {
        console.error("Failed to get default log path:", e);
        return;
      }
    }

    pushDebug(`[bg] starting watcher on ${logPath} (${getLogMode()})`);
    try {
      await startLogWatcher(logPath, handleLogChunk, () => {
        // Catch-up read finished. A forced re-read reconciles matches to cloud;
        // a normal init completes login + starts live memory reads. Either way
        // we now switch to live tailing (overlay updates resume).
        const wasReread = getLogMode() === "reread";
        applyMode("tail");
        if (wasReread) {
          pushDebug("[bg] reread finished → posting REREAD_FINISHED");
          postChannelMessage({ type: "REREAD_FINISHED" });
        } else {
          pushDebug("[bg] log_finished → posting LOG_READ_FINISHED");
          postChannelMessage({ type: "LOG_READ_FINISHED" });
        }
      });
      isWatching = true;
      pushDebug("[bg] watcher started ok");
    } catch (e) {
      pushDebug(`[bg] FAILED to start watcher: ${String(e)}`);
    }
  };

  // Forced re-parse of the current log (UI "Re-read log"). Restart the read
  // from 0 in re_read mode: matches are re-scanned into local history with live
  // side effects suppressed, then REREAD_FINISHED triggers a cloud reconcile.
  const rereadLog = async (): Promise<void> => {
    pushDebug("[bg] REREAD_LOG → re-reading current log");
    try {
      if (isWatching) {
        await stopLogWatcher();
        isWatching = false;
      }
    } catch (e) {
      console.error("Failed to stop watcher for re-read:", e);
    }
    applyMode("reread");
    await startWatching();
  };

  // Handle channel messages
  channel.onmessage = async (msg: MessageEvent<ChannelMessage>) => {
    if (msg.data.type === "START_LOG_READING") {
      pushDebug("[bg] START_LOG_READING received");
      await startWatching();
    }

    if (msg.data.type === "REREAD_LOG") {
      await rereadLog();
    }

    if (msg.data.type === "STOP_LOG_READING" && isWatching) {
      console.log("STOP LOG READING (Tauri)");
      try {
        await stopLogWatcher();
        isWatching = false;
      } catch (e) {
        console.error("Failed to stop log watcher:", e);
      }
    }
  };

  // Start the watcher on init. We do NOT wait for a START_LOG_READING message
  // from the main window: that message races the async bridge setup at startup
  // and is silently lost if it arrives before this window's listener attaches,
  // which left the watcher never started. Watching the log is this (background)
  // window's own responsibility and needs no login, so start it directly.
  (async () => {
    pushDebug("[bg] init → starting log watcher autonomously");
    applyMode("init");
    await startWatching();
  })();
}
