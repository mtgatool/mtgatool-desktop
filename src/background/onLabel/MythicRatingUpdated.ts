import { MythicRatingUpdate } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: MythicRatingUpdate;
}

export default function MythicRatingUpdated(entry: Entry): void {
  const _json = entry.json;
}
