import { PlayerCourse } from "../../types";
import LogEntry from "../../types/logDecoder";
import getSetInEventId from "../../utils/getSetInEventId";
import { setDraftData, setDraftId } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: PlayerCourse;
}
export default function InEventCompleteDraft(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  const set = getSetInEventId(json.InternalEventName);
  setDraftData({ draftSet: set, eventId: json.InternalEventName });
  setDraftId(`${json.Id}-draft`);
}
