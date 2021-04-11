// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";

export interface GunState {
  yourapp: {
    [Username: string]: { age: number };
  };
}

export interface GunDeck {
  playerId: string;
  deckHash: string;
  deckId: string;
  version: number;
  colors: number;
  tile: number;
  format: string;
  internalDeck: string;
  matches: Record<string, boolean>;
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

export interface GunUser {
  matches: Record<string, GunMatch>;
  decksIndex: Record<string, number>;
  decks: Record<string, GunDeck>;
}

export type GunUserChain = IGunChainReference<GunUser, any, "pre_root">;
