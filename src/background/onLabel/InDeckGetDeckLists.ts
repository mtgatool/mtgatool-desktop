import { ArenaV3Deck } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ArenaV3Deck[];
}

export default function InDeckGetDeckLists(
  entry: Entry,
  json: ArenaV3Deck[] = []
): void {
  if (json.length == 0 && entry) {
    const _decks = entry.json;
  }
}
