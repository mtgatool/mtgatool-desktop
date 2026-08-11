import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getSetInEventId from "../../utils/getSetInEventId";
import globalStore from "../store";
import { setDraftData, setDraftId } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: {
    // Old shape.
    EventName?: string;
    IsBotDraft?: boolean;
    // 2026 shape: the response is the updated course.
    CourseId?: string;
    InternalEventName?: string;
    CurrentModule?: string;
  };
}

/**
 * The draft is over. For human drafts this is the ONLY end signal — bot
 * drafts get a "Completed" status response, humans just get this and move to
 * deck selection.
 */
export default function InDraftCompleteDraft(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  const eventName = json.InternalEventName || json.EventName;
  if (eventName) {
    setDraftData({
      draftSet:
        globalStore.currentDraft.draftSet || (getSetInEventId(eventName) ?? ""),
      eventId: eventName,
    });
  }
  if (!globalStore.currentDraft.id && json.CourseId) {
    setDraftId(json.CourseId);
  }

  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
  postChannelMessage({ type: "DRAFT_END" });
}
