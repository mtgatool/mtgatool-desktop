/* eslint-disable radix */
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";
import { setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: {
    Result: string;
    EventName: string;
    DraftStatus: string;
    PackNumber: number;
    PickNumber: number;
    DraftPack: string[];
    PickedCards: string[];
  };
}

export default function onLabelInDraftMakePick(entry: Entry): void {
  const { json } = entry;
  if (!json) return;

  const cards = (json.DraftPack || []).map((n) => parseInt(n));
  const pack = json.PackNumber;
  const pick = json.PickNumber;
  setDraftPack(cards, pack, pick);
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
