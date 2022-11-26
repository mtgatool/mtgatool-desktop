import { InMakeHumanDraftPick } from "mtgatool-shared";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: InMakeHumanDraftPick;
}

export default function onLabelInMakeHumanDraftPick(entry: Entry): void {
  const _json = entry.json;
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
