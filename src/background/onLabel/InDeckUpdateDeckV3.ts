// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV3 from "../../utils/convertDeckFromV3";

interface Entry extends LogEntry {
  json: ArenaV3Deck;
}

// REVIEW Deck.UpdateDeckV3 in the logs
export default function InDeckUpdateDeckV3(entry: Entry): void {
  const { json } = entry;

  const _entryDeck = convertDeckFromV3(json);
  // postChannelMessage({
  //   type: "UPSERT_DB_DECK",
  //   value: entryDeck.getSave(),
  // });
}
