import { PostMatchUpdate } from "../../types";
import LogEntry from "../../types/logDecoder";

export interface Entry extends LogEntry {
  json: PostMatchUpdate;
}

export default function OnPostMatchUpdate(entry: Entry): void {
  const _json = entry.json;
}
