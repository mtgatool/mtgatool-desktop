import { MatchServiceToClientMessage } from "mtgatool-shared/dist/types/greTypes";

import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: MatchServiceToClientMessage;
}

export default function onAuthenticateResponse(entry: Entry): void {
  const _json = entry.json;
}
