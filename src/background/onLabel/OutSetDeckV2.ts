import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { ArenaV4DeckPayload } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV4 from "../../utils/convertDeckFromV4";
import convertV4ListToV2 from "../../utils/convertV4ListToV2";
import selectDeck from "../selectDeck";
import globalStore from "../store";
import { setDraftData } from "../store/currentDraftStore";

interface Entry extends LogEntry {
  json: ArenaV4DeckPayload & {
    EventName: string;
  };
}

export default function OutSetDeckV2(entry: Entry): any {
  const { json } = entry;

  selectDeck(convertDeckFromV4(json));

  // Submitting a deck for the event we just drafted is the draft's final
  // artifact — store it on the draft record so the replay can show it.
  const draft = globalStore.currentDraft;
  // After a mid-draft restart the id may only be recoverable here, from the
  // courses refresh that precedes the deck submit.
  if (!draft.id && draft.eventId === json.EventName) {
    const course = globalStore.currentCourses[json.EventName];
    if (course && course.CourseId) {
      setDraftData({ id: course.CourseId });
    }
  }
  // Re-read: setDraftData above replaces the store object, so the earlier
  // reference would still show the missing id.
  const current = globalStore.currentDraft;
  if (current.id && current.eventId === json.EventName) {
    setDraftData({
      deckId: json.Summary.DeckId,
      deckMain: convertV4ListToV2(json.Deck.MainDeck || []),
      deckSide: convertV4ListToV2(json.Deck.Sideboard || []),
    });
    postChannelMessage({
      type: "DRAFT_SAVE",
      value: globalStore.currentDraft,
    });
  }

  return json;
}
