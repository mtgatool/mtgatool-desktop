import { PlayerProgression } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: PlayerProgression;
}

export default function onLabelInProgressionGetPlayerProgress(
  entry: Entry
): void {
  const _json = entry.json;
}
