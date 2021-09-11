// eslint-disable-next-line import/no-unresolved
import {
  Cards,
  DatabaseClass,
  InternalDeck,
  InternalMatch,
} from "mtgatool-shared";
import { ToolDbClient } from "../../../tool-chain/dist";
import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { InventoryInfo } from "../background/onLabel/InStartHook";
import { OverlayHandler } from "../common/overlayHandler";

declare global {
  interface Window {
    toolDb: ToolDbClient;
    toolDbInitialized: boolean;
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

export interface DbDeck extends InternalDeck {
  playerId: string;
  deckHash: string;
  version: number;
  matches: Record<string, boolean>;
  colors: number;
  hidden: boolean;
  lastUsed: number;
  // lastModified: number;
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
  internalMatch: InternalMatch;
  timestamp: number;
}

export type DbInventoryInfo = Omit<
  InventoryInfo,
  "SeqId" | "Changes" | "CustomTokens" | "Vouchers" | "Cosmetics"
>;

export type DbUUIDData = DbInventoryInfo & {
  rank: CombinedRankInfo;
  updated: number;
};

export interface DbState {
  [record: string]: any;
}
