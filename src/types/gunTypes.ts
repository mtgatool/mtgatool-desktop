// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
import { Cards } from "mtgatool-shared";

export interface GunState {
  [record: string]: any;
}

export interface GunDeck {
  playerId: string;
  name: string;
  deckHash: string;
  deckId: string;
  version: number;
  colors: number;
  tile: number;
  format: string;
  internalDeck: string;
  matches: Record<string, boolean>;
  lastUsed: number;
  stats: {
    gameWins: number;
    gameLosses: number;
    matchWins: number;
    matchLosses: number;
  };
}

export interface GunMatch {
  playerId: string;
  playerDeckId: string;
  playerDeckHash: string;
  playerDeckColors: number;
  oppDeckColors: number;
  playerName: string;
  playerWins: number;
  playerLosses: number;
  eventId: string;
  duration: number;
  internalMatch: string;
  timestamp: number;
}

export interface GunUUIDData {
  gold: number;
  gems: number;
  vaultProgress: number;
  wcTrackPosition: number;
  wcCommon: number;
  wcUncommon: number;
  wcRare: number;
  wcMythic: number;
  cards: Cards;
  cardsPrev: Cards;
  cardsUpdated: number;
  boosters: {
    [collationId: string]: number;
  };
}

export interface GunUser {
  matches: Record<string, GunMatch>;
  decksIndex: Record<string, number>;
  decks: Record<string, GunDeck>;
  defaultUUID: string;
  uuidData: {
    [uuid: string]: GunUUIDData;
  };
}

export type GunUserChain = IGunChainReference<GunUser>;
