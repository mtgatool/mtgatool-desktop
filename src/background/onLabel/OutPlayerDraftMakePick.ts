/* eslint-disable radix */
import LogEntry from "../../types/logDecoder";
import loadDraftRatings from "../../utils/seventeenLands";
import globalStore from "../store";
import { addDraftPick, setDraftId } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: {
    DraftId: string;
    // Old logs sent a single GrpId; current logs send GrpIds (an array,
    // even for single-card picks).
    GrpId?: number;
    GrpIds?: number[];
    Pack: number;
    Pick: number;
  };
}

export default function onLabelOutPlayerDraftMakePick(entry: Entry): void {
  const { json } = entry;

  if (!json) return;
  const { DraftId, Pack, Pick } = json;
  const grpIds = json.GrpIds ?? (json.GrpId ? [json.GrpId] : []);

  // Only when nothing identified the draft yet: EventJoin keys the record by
  // CourseId, and overwriting it with the (different) DraftId here forked the
  // same draft into two records.
  if (!globalStore.currentDraft.id) {
    setDraftId(DraftId);
  }
  grpIds.forEach((grpId) => {
    addDraftPick(
      grpId,
      Pack - 1, // packs and picks start at 1
      Pick - 1
    );
  });

  // Cached after the first fetch; re-broadcast so late-opening overlays get
  // the ratings (human drafts have no per-pick status response to hook).
  if (globalStore.currentDraft.eventId) {
    loadDraftRatings(globalStore.currentDraft.eventId);
  }
}
