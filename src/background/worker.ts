import fs from "fs";

import ArenaLogWatcher from "./arena-log-watcher";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import logEntrySwitch from "./logEntrySwitch";
import getLocalSetting from "../utils/getLocalSetting";

export default function start() {
  if (!fs.existsSync(getLocalSetting("logPath"))) {
    postChannelMessage({
      type: "LOG_READ_FINISHED",
    });
    postChannelMessage({
      type: "POPUP",
      text: "Player log not found! please check your settings.",
      duration: 15000,
    });
  } else {
    ArenaLogWatcher.start({
      path: getLocalSetting("logPath"),
      chunkSize: 268435440,
      onLogEntry: (entry) => {
        logEntrySwitch(entry);
        // This was spammy for no reason
        postChannelMessage({
          type: "LOG_MESSAGE_RECV",
          value: { ...entry, json: {} },
        });
      },
      onError: console.error,
      onFinish: () => {
        postChannelMessage({
          type: "LOG_READ_FINISHED",
        });
      },
    });
  }
}
