import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: {
    IsPickingCompleted: boolean;
    IsPickSuccessful: boolean;
    TableInfo: null;
    PickInfo: null;
    PackInfo: null;
  };
}

export default function onLabelInPlayerDraftMakePick(entry: Entry): void {
  const _json = entry.json;
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
