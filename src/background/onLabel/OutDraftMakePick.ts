/* eslint-disable radix */
import { DraftMakePick } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import { addDraftPick } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: DraftMakePick;
}

export default function onLabelOutDraftMakePick(entry: Entry): void {
  const { json } = entry;
  if (!json || !json.params) return;
  const { packNumber, pickNumber, cardId } = json.params;

  const grpId = parseInt(cardId);
  const pack = parseInt(packNumber);
  const pick = parseInt(pickNumber);

  addDraftPick(grpId, pack, pick);
}
