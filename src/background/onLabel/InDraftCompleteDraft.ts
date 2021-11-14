import { getSetInEventId } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import { setDraftData } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: { EventName: string; IsBotDraft: boolean };
}
export default function InDraftCompleteDraft(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  const set = getSetInEventId(json.EventName);
  setDraftData({ draftSet: set, eventId: json.EventName });
}
