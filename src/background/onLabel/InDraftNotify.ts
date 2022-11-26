/* eslint-disable radix */
import { DraftNotify } from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";
import { setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: DraftNotify;
}

export default function onLabelInDraftNotify(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  const currentPack = json.PackCards.split(",").map((c) => parseInt(c));
  // packs and picks start at 1;
  setDraftPack(currentPack, json.SelfPack - 1, json.SelfPick - 1);
}
