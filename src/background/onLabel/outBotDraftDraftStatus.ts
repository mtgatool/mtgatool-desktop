/* eslint-disable radix */

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import getSetInEventId from "../../utils/getSetInEventId";
import loadDraftRatings from "../../utils/seventeenLands";
import globalStore from "../store";
import { resetCurrentDraft, setDraftData } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: { EventName: string };
}

export default function outBotDraftDraftStatus(entry: Entry): void {
  const { json } = entry;

  if (!json) return;

  // A status request for an event we are not already tracking marks the start
  // of a draft; a re-request mid-draft (reconnect, scene reload) must not wipe
  // the picks accumulated so far.
  if (globalStore.currentDraft.eventId !== json.EventName) {
    resetCurrentDraft();
    setDraftData({
      draftSet: getSetInEventId(json.EventName) ?? "",
      eventId: json.EventName,
      date: new Date().toISOString(),
      arenaId: getLocalSetting("playerId"),
    });
  }

  const course = globalStore.currentCourses[json.EventName];
  if (course && course.CourseId && course.CourseId !== "") {
    setDraftData({ id: course.CourseId });
  }

  loadDraftRatings(json.EventName);
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
