// eslint-disable-next-line import/no-unresolved
import { Cards, DatabaseClass, InternalRank } from "mtgatool-shared";
import { ToolDbClient } from "../../../tool-chain/dist";
import { OverlayHandler } from "../common/overlayHandler";

declare global {
  interface Window {
    toolDb: ToolDbClient;
    database: DatabaseClass;
    overlayHandler: OverlayHandler | undefined;
    globalStore: any;
    cards: Cards;
    cardsPrev: Cards;
  }
}

export interface UserRecoveryData {
  recovery: string;
  iv: string;
}

export interface UserCardsData {
  cards: Cards;
  prevCards: Cards;
  updated: number;
}

export interface DbDeck {
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
  lastModified: number;
  stats: {
    gameWins: number;
    gameLosses: number;
    matchWins: number;
    matchLosses: number;
  };
}

export interface DbMatch {
  playerId: string;
  matchId: string;
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
  actionLog: string;
  timestamp: number;
}

export interface DbUUIDData {
  gold: number;
  gems: number;
  vaultProgress: number;
  wcTrackPosition: number;
  wcCommon: number;
  wcUncommon: number;
  wcRare: number;
  wcMythic: number;
  cards: string;
  cardsPrev: string;
  cardsUpdated: number;
  rank: InternalRank;
  boosters: {
    [collationId: string]: number;
  };
}

export interface DbState {
  [record: string]: any;
}
