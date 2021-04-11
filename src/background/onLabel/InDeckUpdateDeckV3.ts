import { ArenaV3Deck, convertDeckFromV3 } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck;
}

// REVIEW Deck.UpdateDeckV3 in the logs
export default function InDeckUpdateDeckV3(entry: Entry): void {
  const { json } = entry;

  const _entryDeck = convertDeckFromV3(json);
}
