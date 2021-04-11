import { ArenaV3Deck, convertDeckFromV3 } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck[];
}

export default function InDeckGetDeckListsV3(entry: Entry): void {
  const { json } = entry;
  if (json.length == 0) return;

  json.forEach((d) => {
    const deck = convertDeckFromV3(d);
    postChannelMessage({
      type: "UPSERT_GUN_DECK",
      value: deck.getSave(),
    });
  });
}
