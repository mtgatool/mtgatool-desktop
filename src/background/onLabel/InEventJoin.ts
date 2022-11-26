import {
  Deck,
  getSetInEventId,
  InternalDeck,
  ModuleInstanceData,
} from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";
import selectDeck from "../selectDeck";
import {
  resetCurrentDraft,
  setDraftData,
  setDraftId,
} from "../store/currentDraftStore";

interface EntryJson {
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
  json: EntryJson;
}

export default function InEventJoin(entry: Entry): void {
  const { json } = entry;

  if (json.CourseDeck) {
    const deck = new Deck(json.CourseDeck);
    // addCustomDeck(json.CourseDeck);
    selectDeck(deck);
  } else {
    // Most likely a draft
    resetCurrentDraft();
    const set = getSetInEventId(json.InternalEventName);
    setDraftData({ draftSet: set, eventId: json.InternalEventName });
    setDraftId(`${json.Id}-draft`);
  }
}
