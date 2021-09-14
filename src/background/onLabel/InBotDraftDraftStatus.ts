/* eslint-disable radix */
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";
import { setDraftData, setDraftPack } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: {
    Result: string;
    EventName: string;
    DraftStatus: string;
    PackNumber: number;
    PickNumber: number;
    DraftPack: string[];
    PickedCards: string[];
  };
}

export default function InBotDraftDraftStatus(entry: Entry): void {
  const { json } = entry;
  // debugLog("LABEL:  Draft status ", json);
  if (!json) return;

  const pack = json.PackNumber;
  const pick = json.PickNumber;
  const currentPack = (json.DraftPack || []).slice(0).map((n) => parseInt(n));

  setDraftPack(currentPack, pack, pick);

  const course = globalStore.currentCourses[json.EventName];
  if (course && course.CourseId && course.CourseId !== "") {
    setDraftData({ id: course.CourseId });
  }

  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
}
