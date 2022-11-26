import { EventJoinPodmaking } from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: EventJoinPodmaking;
}

export default function InEventJoinPodMaking(entry: Entry): void {
  const _json = entry.json;
}
