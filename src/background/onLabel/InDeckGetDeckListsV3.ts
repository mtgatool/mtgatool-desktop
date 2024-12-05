// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck[];
}

export default function InDeckGetDeckListsV3(entry: Entry): void {
  const { json } = entry;
  if (json.length == 0) return;

  json.forEach((_d) => {
    //   const deck = convertDeckFromV3(d);
    //   postChannelMessage({
    //     type: "UPSERT_DB_DECK",
    //     value: deck.getSave(),
    //   });
  });
}
