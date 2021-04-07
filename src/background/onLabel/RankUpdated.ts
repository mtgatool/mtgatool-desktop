import { RankUpdate } from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: () => RankUpdate;
}

export default function RankUpdated(entry: Entry): void {
  const _json = entry.json();
}
