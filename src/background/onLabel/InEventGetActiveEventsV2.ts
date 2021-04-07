import { ActiveEvent } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ActiveEvent[];
}
export default function InEventGetActiveEventsV2(entry: Entry): void {
  const _json = entry.json;
}
