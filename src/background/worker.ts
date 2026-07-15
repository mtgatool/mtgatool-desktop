import postChannelMessage from "../broadcastChannel/postChannelMessage";
import getLocalSetting from "../utils/getLocalSetting";
import readCards from "../reader/readCards";
import readDecks from "../reader/readDecks";
import ArenaLogWatcher from "./arena-log-watcher";
import { isLiveLog, setLiveLog } from "./logReadState";
import logEntrySwitch from "./logEntrySwitch";

export default function start(): undefined | (() => void) {
  // eslint-disable-next-line global-require
  const fs = require("fs");
  if (!fs.existsSync(getLocalSetting("logPath"))) {
    postChannelMessage({
      type: "LOG_READ_FINISHED",
    });
    postChannelMessage({
      type: "POPUP",
      text: "Player log not found! please check your settings.",
      duration: 15000,
    });
    return undefined;
  }
  return ArenaLogWatcher.start({
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
      // The first onFinish marks the end of the catch-up pass; from here we're
      // tailing live, so label handlers may do their synchronous memory reads.
      if (!isLiveLog()) {
        setLiveLog(true);
        // We skipped all readDecks/readCards during catch-up. Do a single
        // current-state refresh instead of the dozens we avoided — deferred so
        // the UI paints first (these are blocking native reads).
        global.setTimeout(() => {
          try {
            readDecks();
            readCards();
          } catch (e) {
            console.error(e);
          }
        }, 3000);
      }
      postChannelMessage({
        type: "LOG_READ_FINISHED",
      });
    },
  });
}
