/* eslint-disable radix */
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";
import { addDraftPick } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: {
    EventName: string;
    PickInfo: {
      EventName: string;
      CardId: string;
      PackNumber: number;
      PickNumber: number;
    };
  };
}

export default function onLabelOutDraftMakePick(entry: Entry): void {
  const { json } = entry;
  if (!json || !json) return;

  const grpId = parseInt(json.PickInfo.CardId);
  const pack = json.PickInfo.PackNumber;
  const pick = json.PickInfo.PickNumber;

  addDraftPick(grpId, pack, pick);
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
