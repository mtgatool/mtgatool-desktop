import ArenaLogDecoder from "../background/arena-log-decoder/arena-log-decoder";
import bcConnect from "../utils/bcConnect";
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

    decoder.append(text, (entry: any) => {
      // Post each log entry to the broadcast channel
      postChannelMessage({
        type: "LOG_MESSAGE_RECV",
        value: { ...entry, position, size, json: {} },
      });
    });

    // Notify about log check
    postChannelMessage({
      type: "LOG_CHECK",
      value: position,
    });
  };

  // Handle channel messages
  channel.onmessage = async (msg: MessageEvent<ChannelMessage>) => {
    if (msg.data.type === "START_LOG_READING" && !isWatching) {
      console.log("START LOG READING (Tauri)");

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

      try {
        await startLogWatcher(logPath, handleLogChunk);
        isWatching = true;
      } catch (e) {
        console.error("Failed to start log watcher:", e);
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
