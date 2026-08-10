import { InternalDeck, ModuleInstanceData } from "../../types";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import getSetInEventId from "../../utils/getSetInEventId";
import Deck from "../../utils/mtga/deck";
import loadDraftRatings from "../../utils/seventeenLands";
import selectDeck from "../selectDeck";
import globalStore from "../store";
import {
  resetCurrentDraft,
  setDraftData,
  setDraftId,
} from "../store/currentDraftStore";
import { Course } from "./InEventGetCourses";

interface LegacyEntryJson {
  Id: string;
  InternalEventName: string;
  PlayerId: string | null;
  ModuleInstanceData: ModuleInstanceData;
  CurrentEventState: string;
  CurrentModule: string;
  CardPool: null | [];
  CourseDeck: InternalDeck | null;
  PreviousOpponents: [];
}

interface Entry extends LogEntry {
  json: Partial<LegacyEntryJson> & {
    Course?: Course;
  };
}

function beginDraft(eventName: string, courseId: string | undefined): void {
  resetCurrentDraft();
  setDraftData({
    draftSet: getSetInEventId(eventName) ?? "",
    eventId: eventName,
    date: new Date().toISOString(),
    arenaId: getLocalSetting("playerId"),
  });
  if (courseId) {
    setDraftId(courseId);
  }
  loadDraftRatings(eventName);
}

export default function InEventJoin(entry: Entry): void {
  const { json } = entry;

  // Current logs nest the course under Course (beside InventoryInfo for the
  // entry fee); old logs put its fields at the top level.
  const course = json.Course;
  if (course) {
    globalStore.currentCourses[course.InternalEventName] = course;
    // A freshly joined course with no deck yet means a draft is starting. Deck
    // selection for constructed events flows through EventSetDeckV3 instead.
    const hasDeck =
      course.CourseDeck &&
      course.CourseDeck.MainDeck &&
      course.CourseDeck.MainDeck.length > 0;
    if (!hasDeck) {
      beginDraft(course.InternalEventName, course.CourseId);
    }
    return;
  }

  if (json.CourseDeck) {
    const deck = new Deck(json.CourseDeck);
    selectDeck(deck);
  } else if (json.InternalEventName) {
    // Most likely a draft
    beginDraft(json.InternalEventName, json.Id);
  }
}
