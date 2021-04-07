import { ArenaV3Deck } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck;
}

// REVIEW Deck.UpdateDeckV3 in the logs
export default function InDeckUpdateDeckV3(entry: Entry): void {
  const _json = entry.json;
}
