import { InternalDeck, v2cardsList } from "./deck";
import { ModuleInstanceData } from "./event";

export interface DraftStatus {
  DraftId: string;
  DraftStatus: string;
  PackNumber: number;
  PickNumber: number;
  PickedCards: string[];
  DraftPack: string[];
}

export interface DraftMakePick {
  jsonrpc: string;
  method: string;
  params: {
    draftId: string;
    cardId: string;
    packNumber: string;
    pickNumber: string;
  };
}

export interface DraftState {
  packN: number;
  pickN: number;
}

export interface InternalDraftv2 {
  archived: boolean;
  owner: string;
  arenaId: string;
  date: string;
  eventId: string;
  id?: string;
  draftSet: string;
  currentPack: number;
  currentPick: number;
  pickedCards: number[];
  packs: [number[][], number[][], number[][]];
  picks: [number[], number[], number[]];
  type: "draft";
  // The deck submitted for the event once the draft ended, when we saw it.
  deckId?: string;
  deckMain?: v2cardsList;
  deckSide?: v2cardsList;
}

export interface InternalDraftPackPick {
  pack: string[];
  pick: string;
}

export interface InternalDraft {
  eventId: string;
  draftId: string;
  arenaId: string;
  id: string;
  owner: string;
  player: string;
  PlayerId: null | string;
  set: string;
  InternalEventName: string;
  date: string;
  type: string;
  CardPool: null | string[];
  CourseDeck: null | InternalDeck;
  pickedCards: string[];
  currentPack: string[];
  packNumber: number;
  pickNumber: number;
  [key: string]: any;
  DraftStatus?: string;
  DraftPack?: string[];
  PickedCards?: string[];
  ModuleInstanceData?: ModuleInstanceData;
  CurrentEventState?: string;
  CurrentModule?: string;
  PreviousOpponents?: string[];
}

/** One card's 17lands rating for the set being drafted. */
export interface DraftRating {
  /** Letter grade derived from the win rate's z-score within the set. */
  grade: string;
  /** "Games in hand" win rate, 0..1 — the headline 17lands number. */
  gihwr: number;
  /** Average last seen at — how late the card wheels. */
  alsa: number;
}

export type DraftRatings = Record<number, DraftRating>;

export interface DraftNotify {
  draftId: string;
  SelfPick: number;
  SelfPack: number;
  PackCards: string;
}

export interface OutMakeHumanDraftPick {
  jsonrpc: string;
  method: string;
  params: {
    draftId: string;
    cardId: string;
    packNumber: string;
    pickNumber: string;
  };
  id: string;
}

export interface EventJoinPodmaking {
  jsonrpc: string;
  method: string;
  params: {
    queueId: string;
  };
  id: string;
}

export interface InMakeHumanDraftPick {
  IsPickingCompleted: boolean;
  IsPickSuccessful: boolean;
  TableInfo: null | unknown;
  PickInfo: null | unknown;
  PackInfo: null | unknown;
}
