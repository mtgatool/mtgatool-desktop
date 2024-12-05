import { Format } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: Format[];
}

export default function GetPlayerInventoryGetFormats(entry: Entry): void {
  const _json = entry.json;
}
