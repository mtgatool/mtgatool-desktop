/* eslint-disable @typescript-eslint/ban-types */

import Deck from "../utils/mtga/deck";
import Chances from "./chances";
import { CardCast, MatchGameStats, PriorityTimers } from "./currentMatch";
import { InternalDeck } from "./deck";
import { Result } from "./greInterpreter";
import {
  AnnotationInfo,
  GameInfo,
  GameObjectInfo,
  GREToClientMessage,
  Phase,
  PlayerInfo,
  TurnInfo,
  ZoneInfo,
} from "./greTypes";

export interface Heat {
  seat: number;
  value: number;
  turn: number | undefined;
  phase: Phase;
}

export interface InternalPlayer {
  wins: number;
  seat: number;
  userid: string;
  name: string;
  commanderGrpIds: any;
  companionGrpId: number;
  cardsUsed: number[];
  rank: string;
  tier: number;
  step?: number;
  percentile?: number;
  leaderboardPlace?: number;
}

export interface MatchPlayerStats {
  lifeGained: number;
  lifeLost: number;
  manaUsed: number;
  /** grpId -> total damage dealt by that card. */
  damage: Record<string, number>;
  /** One entry per life change, in order — the "life remaining" blocks. */
  lifeTotals: number[];
}

/**
 * The end-of-match summary, for the post-match overview.
 *
 * Optional because it is only written from the version that started recording
 * it: every match saved before then has none, and the overview hides whatever
 * is missing rather than drawing empty bars.
 */
export interface MatchPostStats {
  statsHeatMap: Heat[];
  totalTurns: number;
  playerStats: MatchPlayerStats;
  oppStats: MatchPlayerStats;
}

export interface InternalMatch {
  draws: number;
  arenaId: string;
  postStats?: MatchPostStats;
  playerDeck: InternalDeck;
  oppDeck: InternalDeck;
  date: string;
  onThePlay: number;
  eventId: string;
  bestOf: number;
  gameStats: Record<number, MatchGameStats>;
  toolVersion: number;
  toolRunFromSource: boolean;
  id: string;
  duration: number;
  player: InternalPlayer;
  opponent: InternalPlayer;
  playerDeckHash: string;
  actionLog: string;
  type: "match";
}

export interface MatchState {
  logTime: Date;
  matchStarted: boolean;
  matchId: string;
  eventId: string;
  onThePlay: number;
  msgId: number;
  playerSeat: number;
  oppSeat: number;
  opponent: InternalPlayer;
  gameWinner: number;
  statsHeatMap: Heat[];
  totalTurns: number;
  playerStats: {
    lifeGained: number;
    lifeLost: number;
    manaUsed: number;
    damage: Record<string, number>;
    lifeTotals: number[];
  };
  oppStats: {
    lifeGained: number;
    lifeLost: number;
    manaUsed: number;
    damage: Record<string, number>;
    lifeTotals: number[];
  };
  // Decks
  currentDeck: Deck;
  originalDeck: Deck;
  cardsLeft: Deck;
  cardsFromSideboard: number[];
  cardsBottom: number[];
  // Info
  player: InternalPlayer;
  players: PlayerInfo[];
  turnInfo: TurnInfo;
  gameInfo: GameInfo;
  // Time stuff
  beginTime: Date;
  priorityTimers: PriorityTimers;
  currentPriority: number;
  // Zones, objects, annotations, ids tracking
  GREtoClient: GREToClientMessage[];
  zones: Record<number, ZoneInfo>;
  annotations: Record<number, AnnotationInfo>;
  processedAnnotations: number[];
  gameObjects: Record<number, GameObjectInfo>;
  initialLibraryInstanceIds: number[];
  instanceToCardIdMap: Record<number, number>;
  idChanges: Record<number, number>;
  cardsCast: CardCast[];
  handsDrawn: number[][];
  matchGameStats: MatchGameStats[];
  cardsOdds: Chances;
}

interface ReservedPlayer {
  userId: string;
  playerName: string;
  systemSeatId: number;
  teamId: number;
  connectionInfo: {
    connectionState: string;
  };
  courseId: string;
}

interface RoomPlayer {
  userId: string;
  systemSeatId: number;
}

interface GameRoomInfo {
  stateType: string;
}

interface MatchGameRoomStateTypePlaying extends GameRoomInfo {
  stateType: "MatchGameRoomStateType_Playing";
  gameRoomConfig: {
    eventId: string;
    reservedPlayers: ReservedPlayer[];
    matchId: string;
    matchConfig: {};
    greConfig: {
      gameStateRedactorConfiguration: {
        enableRedaction: boolean;
        enableForceDiff: boolean;
      };
      clipsConfiguration: {};
      checkpointConfiguration: {};
    };
    greHostLoggerLevel: string;
    joinRoomTimeoutSecs: number;
    playerDisconnectTimeoutSecs: number;
  };
}

interface MatchGameRoomStateTypeMatchCompleted extends GameRoomInfo {
  stateType: "MatchGameRoomStateType_MatchCompleted";
  gameRoomConfig: {
    eventId: string;
    matchId: string;
  };
  finalMatchResult: {
    matchId: string;
    matchCompletedReason: string;
    resultList: Result[];
  };
}

type MatchGameRoom =
  | MatchGameRoomStateTypePlaying
  | MatchGameRoomStateTypeMatchCompleted;

export interface MatchGameRoomStateChange {
  transactionId: string;
  timestamp: string;
  players: RoomPlayer[];
  matchGameRoomStateChangedEvent: {
    gameRoomInfo: MatchGameRoom;
  };
}
