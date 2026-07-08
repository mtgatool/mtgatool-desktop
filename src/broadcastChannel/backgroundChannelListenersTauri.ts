import ArenaLogDecoder from "../background/arena-log-decoder/arena-log-decoder";
import logEntrySwitch from "../background/logEntrySwitch";
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

      // Progress notification only (json stripped to keep the message light).
      postChannelMessage({
        type: "LOG_MESSAGE_RECV",
        value: { ...entry, position, size, json: {} },
      });
    });
    pushDebug(
      `[bg] log chunk ${text.length}b @${position}/${size} → ${entryCount} entries`
    );

    // Notify about log check
    postChannelMessage({
      type: "LOG_CHECK",
    });
  };

  // Handle channel messages
  channel.onmessage = async (msg: MessageEvent<ChannelMessage>) => {
    if (msg.data.type === "START_LOG_READING" && !isWatching) {
      pushDebug("[bg] START_LOG_READING received, starting watcher");

      // Reset decoder
      decoder = ArenaLogDecoder();

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

      pushDebug(`[bg] starting watcher on ${logPath}`);
      try {
        await startLogWatcher(logPath, handleLogChunk, () => {
          // Initial (historical) read caught up — tells the app it can
          // complete login and start live scene-driven memory reads.
          pushDebug("[bg] log_finished → posting LOG_READ_FINISHED");
          postChannelMessage({ type: "LOG_READ_FINISHED" });
        });
        isWatching = true;
        pushDebug("[bg] watcher started ok");
      } catch (e) {
        pushDebug(`[bg] FAILED to start watcher: ${String(e)}`);
      }
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

  // Initialize log path on startup
  (async () => {
    const logUri = getLocalSetting("logPath");
    if (!logUri || logUri.indexOf("undefined/") > -1) {
      try {
        const defaultPath = await getDefaultLogPath();
        setLocalSetting("logPath", defaultPath);
        console.log("Initialized log path:", defaultPath);
      } catch (e) {
        console.error("Failed to initialize log path:", e);
      }
    }
  })();
}
