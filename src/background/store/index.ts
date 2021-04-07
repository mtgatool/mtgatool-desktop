import {
  ArenaV3Deck,
  constants,
  DeckChange,
  InternalDeck,
  InternalDraftv2,
  InternalEconomyTransaction,
  InternalEvent,
  InternalMatch,
  SeasonalRankData,
} from "mtgatool-shared";
import isValid from "date-fns/isValid";
import parseISO from "date-fns/parseISO";

import { draftStateObject } from "./currentDraftStore";
import { matchStateObject } from "./currentMatchStore";
import prettierDeckData from "../../utils/prettierDeckData";
import getDeckColors from "../../utils/getDeckColors";

const { DEFAULT_TILE } = constants;

const defaultDeck = JSON.parse(
  `{"deckTileId":${DEFAULT_TILE},"description":null,"format":"Standard","colors":[],"id":"00000000-0000-0000-0000-000000000000","isValid":false,"lastUpdated":"2018-05-31T00:06:29.7456958","lockedForEdit":false,"lockedForUse":false,"mainDeck":[],"name":"Undefined","resourceId":"00000000-0000-0000-0000-000000000000","sideboard":[]}`
);

// Use this store only when redux struggles with the data (too complex, too deep)
// Or when there is not need to use the redux/react selector wizardy.
const globalStore = {
  matches: {} as Record<string, InternalMatch>,
  events: {} as Record<string, InternalEvent>,
  decks: {} as Record<string, InternalDeck>,
  staticDecks: [] as string[],
  transactions: {} as Record<string, InternalEconomyTransaction>,
  draftsv2: {} as Record<string, InternalDraftv2>,
  seasonal: {} as Record<string, SeasonalRankData>,
  deckChanges: {} as Record<string, DeckChange>,
  currentMatch: matchStateObject,
  currentDraft: draftStateObject,
  preconDecks: {} as { [id: string]: ArenaV3Deck },
};

//
// Match utility functions
//
export function getMatch(id: string): InternalMatch | undefined {
  // return globalStore.matches[id] || undefined;
  if (!id || !globalStore.matches[id]) return undefined;
  const matchData = globalStore.matches[id];
  let preconData = {};
  if (
    matchData.playerDeck &&
    matchData.playerDeck.id in globalStore.preconDecks
  ) {
    preconData = globalStore.preconDecks[matchData.playerDeck.id];
  }
  const playerDeck = prettierDeckData({
    ...defaultDeck,
    ...preconData,
    ...matchData.playerDeck,
  });
  playerDeck.colors = getDeckColors(playerDeck);

  const oppDeck = { ...defaultDeck, ...matchData.oppDeck };
  oppDeck.colors = getDeckColors(oppDeck);

  return {
    ...matchData,
    id,
    oppDeck,
    playerDeck,
    type: "match",
  };
}

export function matchExists(id: string): boolean {
  return !!globalStore.matches[id];
}

export function matchesList(): InternalMatch[] {
  return Object.keys(globalStore.matches).map(
    (key: string) => globalStore.matches[key]
  );
}

//
// Events utility functions
//
export function getEvent(id: string): InternalEvent | undefined {
  if (!id || !globalStore.events[id]) return undefined;
  const eventData = globalStore.events[id];
  return {
    ...eventData,
    // custom: !static_events.includes(id),
    type: "Event",
  };
}

export function eventExists(id: string): boolean {
  return !!globalStore.events[id];
}

export function eventsList(): InternalEvent[] {
  return Object.keys(globalStore.events).map(
    (key: string) => globalStore.events[key]
  );
}

//
// Decks utility functions
//
export function getDeck(id: string): InternalDeck | undefined {
  if (!id || !globalStore.decks[id]) return undefined;
  const preconData = globalStore.preconDecks[id] || {};
  const deckData = {
    ...preconData,
    ...globalStore.decks[id],
    colors: getDeckColors(globalStore.decks[id]),
    custom: !globalStore.staticDecks.includes(id),
  };
  // lastUpdated does not specify timezone but implicitly occurs at UTC
  // attempt to add UTC timezone to lastUpdated iff result would be valid
  if (
    deckData.lastUpdated &&
    !deckData.lastUpdated.includes("Z") &&
    isValid(parseISO(`${deckData.lastUpdated}Z`))
  ) {
    deckData.lastUpdated += "Z";
  }
  return prettierDeckData(deckData);
}

export function getDeckName(deckId: string): string {
  return globalStore.decks[deckId]?.name ?? deckId;
}

export function deckExists(id: string): boolean {
  return !!globalStore.decks[id];
}

export function decksList(): InternalDeck[] {
  return Object.keys(globalStore.decks).map(
    (key: string) => globalStore.decks[key]
  );
}

//
// Deck Changes utility functions
//
/*
export function getDeckChange(id: string): DeckChange | undefined {
  if (!id || !globalStore.deckChanges[id]) return undefined;
  return globalStore.deckChanges[id];
}
*/

export function deckChangeExists(id: string): boolean {
  return !!globalStore.deckChanges[id];
}

export function getDeckChangesList(id?: string): DeckChange[] {
  return Object.keys(globalStore.deckChanges)
    .map((_id) => globalStore.deckChanges[_id])
    .filter((change) => change && change.deckId === id);
}

//
// Economy utility functions
//
export function getTransaction(
  id: string
): InternalEconomyTransaction | undefined {
  if (!id || !globalStore.transactions[id]) return undefined;
  const txnData = globalStore.transactions[id];
  return {
    ...txnData,
    // Some old data stores the raw original context in ".originalContext"
    // All NEW data stores this in ".context" and ".originalContext" is blank.
    originalContext: txnData.originalContext ?? txnData.context,
  };
}

export function transactionExists(id: string): boolean {
  return !!globalStore.transactions[id];
}

export function transactionsList(): InternalEconomyTransaction[] {
  return Object.keys(globalStore.transactions).map(
    (key: string) => globalStore.transactions[key]
  );
}

//
// Draft utility functions
//
export function getDraft(id: string): InternalDraftv2 | undefined {
  return id ? globalStore.draftsv2[id] : undefined;
}

export function draftExists(id: string): boolean {
  return !!globalStore.draftsv2[id];
}
/*
export function draftsList(): InternalDraftv2[] {
  return Object.keys(globalStore.draftsv2).map(
    (key: string) => globalStore.draftsv2[key]
  );
}
*/

//
// Seasonal utility functions
//
export function getSeasonal(id: string): SeasonalRankData | undefined {
  if (!id || !globalStore.seasonal[id]) return undefined;
  return globalStore.seasonal[id];
}

export function seasonalExists(id: string): boolean {
  return !!globalStore.seasonal[id];
}

export function seasonalList(ids: string[] = []): SeasonalRankData[] {
  if (ids.length == 0) {
    return Object.keys(globalStore.seasonal).map(
      (key: string) => globalStore.seasonal[key]
    );
  }
  return ids.map((id) => globalStore.seasonal[id]).filter((update) => update);
}

export default globalStore;
