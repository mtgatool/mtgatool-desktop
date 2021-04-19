import { ArenaV3Deck, convertDeckFromV3 } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck;
}

// REVIEW Deck.UpdateDeckV3 in the logs
export default function InDeckUpdateDeckV3(entry: Entry): void {
  const { json } = entry;

  const entryDeck = convertDeckFromV3(json);
  postChannelMessage({
    type: "UPSERT_GUN_DECK",
    value: entryDeck.getSave(),
  });
}
