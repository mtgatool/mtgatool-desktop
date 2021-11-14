/* eslint-disable radix */
import LogEntry from "../../types/logDecoder";
import { addDraftPick, setDraftId } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: { DraftId: string; GrpId: number; Pack: number; Pick: number };
}

export default function onLabelOutPlayerDraftMakePick(entry: Entry): void {
  const { json } = entry;

  if (!json) return;
  const { DraftId, Pack, Pick, GrpId } = json;

  setDraftId(DraftId);
  addDraftPick(
    GrpId,
    Pack - 1, // packs and picks start at 1
    Pick - 1
  );
}
