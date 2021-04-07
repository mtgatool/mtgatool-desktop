/* eslint-disable radix */
import { DraftStatus } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import { setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: DraftStatus;
}

export default function InDraftDraftStatus(entry: Entry): void {
  const { json } = entry;
  // debugLog("LABEL:  Draft status ", json);
  if (!json) return;

  const pack = json.PackNumber;
  const pick = json.PickNumber;
  const currentPack = (json.DraftPack || []).slice(0).map((n) => parseInt(n));

  setDraftPack(currentPack, pack, pick);
}
