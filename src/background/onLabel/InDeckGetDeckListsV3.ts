// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck[];
}

export default function InDeckGetDeckListsV3(entry: Entry): void {
  const { json } = entry;
  // Arena does not always send an array here any more. `json.length` is then
  // undefined, which slips past a `== 0` check and blows up on forEach — and a
  // throwing handler used to wedge the whole log reader (see
  // arena-log-watcher's append callback).
  if (!Array.isArray(json) || json.length == 0) return;

  json.forEach((_d) => {
    //   const deck = convertDeckFromV3(d);
    //   postChannelMessage({
    //     type: "UPSERT_DB_DECK",
    //     value: deck.getSave(),
    //   });
  });
}
