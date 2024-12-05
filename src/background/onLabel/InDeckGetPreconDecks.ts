import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck[];
}

export default function InDeckGetPreconDecks(entry: Entry): void {
  const _json = entry.json;
}
