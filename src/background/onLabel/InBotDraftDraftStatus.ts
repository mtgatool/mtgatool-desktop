/* eslint-disable radix */
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getSetInEventId from "../../utils/getSetInEventId";
import loadDraftRatings from "../../utils/seventeenLands";
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

  // A "Completed" status repeats the last pick's coordinates with an empty
  // DraftPack; writing it would erase the recorded one-card pack.
  if (currentPack.length > 0) {
    setDraftPack(currentPack, pack, pick);
  }

  // The server's picked list is authoritative — it also repairs state when the
  // outgoing pick lines were missed (e.g. a catch-up read joining mid-draft).
  if (json.PickedCards && json.PickedCards.length > 0) {
    setDraftData({ pickedCards: json.PickedCards.map((n) => parseInt(n)) });
  }

  const course = globalStore.currentCourses[json.EventName];
  if (course && course.CourseId && course.CourseId !== "") {
    setDraftData({ id: course.CourseId });
  }

  // The set is derived from database.sets, which loads async from the cards
  // worker — a draft joined before it lands gets an empty draftSet. Each
  // status response is a chance to backfill it.
  if (globalStore.currentDraft.draftSet === "" && json.EventName) {
    setDraftData({ draftSet: getSetInEventId(json.EventName) ?? "" });
  }

  // Cached after the first call; re-broadcasts so a late-opening overlay
  // still receives the ratings.
  loadDraftRatings(json.EventName);

  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });

  // A status poll after the last pick reports Completed too — same end signal
  // as the final pick response (see InDraftMakePick).
  if (json.DraftStatus === "Completed") {
    postChannelMessage({ type: "DRAFT_END" });
  }
}
