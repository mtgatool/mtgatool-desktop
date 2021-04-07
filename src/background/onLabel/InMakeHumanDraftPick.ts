import { InMakeHumanDraftPick } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: InMakeHumanDraftPick;
}

export default function onLabelInMakeHumanDraftPick(entry: Entry): void {
  const _json = entry.json;
}
