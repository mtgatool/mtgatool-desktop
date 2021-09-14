/* eslint-disable radix */
import { getSetInEventId } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";
import { resetCurrentDraft, setDraftData } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: { EventName: string };
}

export default function outBotDraftDraftStatus(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  resetCurrentDraft();
  const set = getSetInEventId(json.EventName);
  setDraftData({ draftSet: set, eventId: json.EventName });

  const course = globalStore.currentCourses[json.EventName];
  if (course && course.CourseId && course.CourseId !== "") {
    setDraftData({ id: course.CourseId });
  }

  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
