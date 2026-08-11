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
      // Old logs sent a single CardId; current logs send CardIds (an array,
      // even for single-card picks).
      CardId?: string;
      CardIds?: string[];
      PackNumber: number;
      PickNumber: number;
    };
  };
}

export default function onLabelOutDraftMakePick(entry: Entry): void {
  const { json } = entry;
  if (!json || !json.PickInfo) return;

  const cardIds = json.PickInfo.CardIds ?? [json.PickInfo.CardId ?? ""];
  const pack = json.PickInfo.PackNumber;
  const pick = json.PickInfo.PickNumber;

  cardIds.forEach((cardId) => {
    const grpId = parseInt(cardId);
    if (!Number.isNaN(grpId)) {
      addDraftPick(grpId, pack, pick);
    }
  });
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
