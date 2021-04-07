/* eslint-disable radix */
import { OutMakeHumanDraftPick } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import { addDraftPick } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: () => OutMakeHumanDraftPick;
}

export default function onLabelOutMakeHumanDraftPick(entry: Entry): void {
  const json = entry.json();

  if (!json || !json.params) return;
  const { packNumber, pickNumber, cardId } = json.params;

  addDraftPick(
    parseInt(cardId),
    parseInt(packNumber) - 1, // packs and picks start at 1
    parseInt(pickNumber) - 1
  );
}
