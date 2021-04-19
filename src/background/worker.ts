import defaultLogUri from "../utils/defaultLogUri";
import ArenaLogWatcher from "./arena-log-watcher";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import logEntrySwitch from "./logEntrySwitch";

export default function start() {
  ArenaLogWatcher.start({
    path: defaultLogUri(),
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
