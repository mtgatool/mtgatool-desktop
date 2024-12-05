import { InternalDeck } from "./deck";
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
