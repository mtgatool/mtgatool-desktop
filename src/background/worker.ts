import postChannelMessage from "../broadcastChannel/postChannelMessage";
import readCards from "../reader/readCards";
import readDecks from "../reader/readDecks";
import getLocalSetting from "../utils/getLocalSetting";
import ArenaLogWatcher from "./arena-log-watcher";
import findInProgressMatch from "./findInProgressMatch";
import logEntrySwitch from "./logEntrySwitch";
import { isLiveLog, setLiveLog } from "./logReadState";

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

  const skipInitialBackfill = getLocalSetting("importLogHistory") !== "true";

  // Opening the tracker during a game would otherwise join the match halfway
  // and save it with no decklists and a 0-0 scoreline. Start from that match's
  // beginning instead; null when nothing is being played, which is the usual
  // case and leaves startup exactly as it was.
  const inProgress = skipInitialBackfill
    ? findInProgressMatch(getLocalSetting("logPath"))
    : null;

  if (inProgress !== null) {
    // Everything about to be replayed belongs to the match being played right
    // now, so the handlers that read live game memory — the opponent's rank
    // above all — are reading the very match they are being asked about. The
    // flag exists to stop those reads during a *historical* catch-up, where
    // they would answer about the wrong game; here it would only throw away
    // the rank that made the match look broken in the first place.
    setLiveLog(true);
    console.log(`[log] match in progress, replaying it from ${inProgress}`);
  }

  return ArenaLogWatcher.start({
    path: getLocalSetting("logPath"),
    chunkSize: 268435440,
    // Forward-only by default: skip replaying the whole Player.log on startup
    // (rank is gone from the log anyway, and matches are already in the DB /
    // restored from cloud). Users can opt into a full import in Data settings.
    skipInitialBackfill,
    initialPosition: inProgress ?? undefined,
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
