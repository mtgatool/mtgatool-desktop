// eslint-disable-next-line import/no-unresolved
import {
  Cards,
  DatabaseClass,
  InternalDeck,
  InternalMatch,
} from "mtgatool-shared";
import ToolDbClient from "tool-db/dist/toolDbClient";

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

export type DbUUIDData = {
  inventory: DbInventoryInfo;
  rank: CombinedRankInfo;
  cards: Cards;
  prevCards: Cards;
  updatedCards: number;
  updated: number;
};

export interface DbState {
  [record: string]: any;
}

export type DbUserids = Record<string, number>;

export const defaultUUIDData: DbUUIDData = {
  inventory: {
    Gems: 0,
    Gold: 0,
    TotalVaultProgress: 0,
    wcTrackPosition: 0,
    WildCardCommons: 0,
    WildCardUnCommons: 0,
    WildCardRares: 0,
    WildCardMythics: 0,
    DraftTokens: 0,
    SealedTokens: 0,
    Boosters: [],
  },
  rank: {
    playerId: "",
    constructedSeasonOrdinal: 0,
    constructedClass: "Unranked",
    constructedLevel: 0,
    constructedStep: 0,
    constructedMatchesWon: 0,
    constructedMatchesLost: 0,
    constructedMatchesDrawn: 0,
    limitedSeasonOrdinal: 0,
    limitedClass: "Unranked",
    limitedLevel: 0,
    limitedStep: 0,
    limitedMatchesWon: 0,
    limitedMatchesLost: 0,
    limitedMatchesDrawn: 0,
    constructedPercentile: 0,
    constructedLeaderboardPlace: 0,
    limitedPercentile: 0,
    limitedLeaderboardPlace: 0,
  },
  cards: {},
  prevCards: {},
  updatedCards: new Date().getTime(),
  updated: new Date().getTime(),
};
