/* eslint-disable radix */

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { DraftNotify } from "../../types";
import LogEntry from "../../types/logDecoder";
import loadDraftRatings from "../../utils/seventeenLands";
import globalStore from "../store";
import { setDraftId, setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: DraftNotify;
}

export default function onLabelInDraftNotify(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  const currentPack = json.PackCards.split(",").map((c) => parseInt(c));
  // packs and picks start at 1;
  setDraftPack(currentPack, json.SelfPack - 1, json.SelfPick - 1);

  // Human drafts identify themselves by DraftId on every notification —
  // survives a mid-draft restart where the EventJoin was never replayed.
  if (!globalStore.currentDraft.id && json.draftId) {
    setDraftId(json.draftId);
  }

  if (globalStore.currentDraft.eventId) {
    loadDraftRatings(globalStore.currentDraft.eventId);
  }

  // Each notification is a new pack on offer — the overlay follows these.
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
