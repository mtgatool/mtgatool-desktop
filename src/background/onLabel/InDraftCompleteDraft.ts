import LogEntry from "../../types/logDecoder";
import getSetInEventId from "../../utils/getSetInEventId";
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
