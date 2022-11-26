// eslint-disable-next-line import/no-unresolved
import { ToolDb } from "mtgatool-db";
import {
  Cards,
  DatabaseClass,
  InternalMatch,
  v2cardsList,
} from "mtgatool-shared";

import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { InventoryInfo } from "../background/onLabel/InStartHook";
import { OverlayHandler } from "../common/overlayHandler";

declare global {
  interface Window {
    toolDb: ToolDb;
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

export interface CardWinrateData {
  name: string;
  wins: number;
  losses: number;
  turnsUsed: number[];
  turnsFirstUsed: number[];
  sidedIn: number;
  sidedOut: number;
  sideInWins: number;
  sideInLosses: number;
  sideOutWins: number;
  sideOutLosses: number;
  initHandWins: number;
  initHandsLosses: number;
  mulligans: number;
  colors: { [key: number]: { wins: number; losses: number } };
}

export interface StatsDeck {
  id: string;
  deckTileId: number;
  name: string;
  mainDeck: v2cardsList;
  sideboard: v2cardsList;
  playerId: string;
  deckHash: string;
  matches: Record<string, boolean>;
  colors: number;
  lastUsed: number;
  stats: {
    gameWins: number;
    gameLosses: number;
    matchWins: number;
    matchLosses: number;
  };
  totalGames: number;
  cardWinrates: Record<number, CardWinrateData>;
  winrate: number;
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

export type DbCardsData = {
  cards: Cards;
  prevCards: Cards;
  updated: number;
};

export interface DbInventoryData extends DbInventoryInfo {
  updated: number;
}

export interface DbRankData extends CombinedRankInfo {
  updated: number;
}

export interface DbState {
  [record: string]: any;
}

export type DbUserids = Record<string, number>;

export const defaultInventoryData: DbInventoryInfo = {
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
};

export const defaultRankData: CombinedRankInfo = {
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
};

export const defaultCardsData: DbCardsData = {
  cards: {},
  prevCards: {},
  updated: new Date().getTime(),
};

export interface DbAccount {
  displayName: string;
  bio: string;
}

export interface DbDraftVote {
  pubKey: string;
  signature: string;
  pack: number;
  pick: number;
  vote: number;
}

// Key is live-draft-v1-${id}
// We use versioning to allow upgrades on the protocol
// Verification will only allow owner to modify
// Others can add votes (subject to verification and deduplication checks)
// On each pick votes are reset?
export interface DbliveDraftV1 {
  owner: string;
  ref: string;
  // votes key should be unique per vote, like
  // {pubKey}-{pack}-{pick}
  votes: Record<string, DbDraftVote>;
}
