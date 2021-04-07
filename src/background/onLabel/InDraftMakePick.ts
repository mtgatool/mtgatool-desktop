/* eslint-disable radix */
import { DraftStatus } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import { setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: DraftStatus;
}

export default function onLabelInDraftMakePick(entry: Entry): void {
  const { json } = entry;
  // debugLog("LABEL:  Make pick < ", json);
  if (!json) return;

  const cards = (json.DraftPack || []).map((n) => parseInt(n));
  const pack = json.PackNumber;
  const pick = json.PickNumber;
  setDraftPack(cards, pack, pick);
  // we do everything in the out msg
}
