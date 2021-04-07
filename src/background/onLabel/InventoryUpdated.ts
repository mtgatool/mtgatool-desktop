import { InventoryUpdate } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface EntryJson {
  context: string;
  updates: InventoryUpdate[];
}

interface Entry extends LogEntry {
  json: EntryJson;
}

// Called for all "Inventory.Updated" labels
export default function InventoryUpdated(entry: Entry): void {
  const _json = entry.json;
}
