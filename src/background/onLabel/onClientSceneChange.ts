import LogEntry, { ClientSceneChange } from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: () => ClientSceneChange;
}

export default function onClientSceneChange(entry: Entry): void {
  const _json = entry.json;
}
