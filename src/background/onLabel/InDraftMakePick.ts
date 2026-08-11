/* eslint-disable radix */
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
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

export default function onLabelInDraftMakePick(entry: Entry): void {
  const { json } = entry;
  if (!json) return;

  // A restart mid-draft loses the in-memory draft (the join/status events do
  // not re-fire); rebuild identity from what every pick response carries, and
  // re-adopt the record id from the courses cache when it lands.
  if (globalStore.currentDraft.eventId !== json.EventName) {
    setDraftData({
      eventId: json.EventName,
      draftSet: getSetInEventId(json.EventName) ?? "",
      date: globalStore.currentDraft.date || new Date().toISOString(),
      arenaId: globalStore.currentDraft.arenaId || getLocalSetting("playerId"),
    });
  }
  if (!globalStore.currentDraft.id) {
    const course = globalStore.currentCourses[json.EventName];
    if (course && course.CourseId) {
      setDraftData({ id: course.CourseId });
    }
  }

  const cards = (json.DraftPack || []).map((n) => parseInt(n));
  const pack = json.PackNumber;
  const pick = json.PickNumber;
  // The draft's final response ("Completed") repeats the last pick's
  // coordinates with an EMPTY DraftPack — writing that would erase the
  // one-card pack the previous response recorded there.
  if (cards.length > 0) {
    setDraftPack(cards, pack, pick);
  }

  // The server's picked list is authoritative — it also repairs state when the
  // outgoing pick lines were missed (e.g. a catch-up read joining mid-draft).
  if (json.PickedCards && json.PickedCards.length > 0) {
    setDraftData({ pickedCards: json.PickedCards.map((n) => parseInt(n)) });
  }

  // Cached after the first fetch; each pick re-broadcasts so an overlay that
  // opened after the draft started still receives the ratings.
  loadDraftRatings(json.EventName);

  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });

  // The response to the final pick says so itself. The Draft->DeckBuilder
  // scene change is NOT a reliable end signal: its JSON carries a spaced
  // context ("deck builder"), which the log decoder's bare-label pattern
  // cannot represent, so that entry never reaches the scene handler.
  if (json.DraftStatus === "Completed") {
    postChannelMessage({ type: "DRAFT_END" });
  }
}
