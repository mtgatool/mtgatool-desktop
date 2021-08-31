import LogEntry from "../../types/logDecoder";

interface StartHook {
  Formats: any[];
}

interface Entry extends LogEntry {
  json: StartHook;
}

export default function InStartHook(entry: Entry): void {
  const _json = entry.json;
}
