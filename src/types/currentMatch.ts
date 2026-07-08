import Deck from "../utils/mtga/deck";
import Chances from "./chances";
import { InternalDeck } from "./deck";
import {
  GameObject,
  PlayerData,
  Result,
  ZoneData,
  ZoneType,
} from "./greInterpreter";
import {
  AnnotationInfo,
  GameInfo,
  GREToClientMessage,
  TurnInfo,
} from "./greTypes";

export interface MatchPlayer {
  seat: number;
  deck: Deck;
  cards: number[];
  originalDeck: Deck;
  commanderGrpIds: number[];
  name: string;
  life: number;
  turn: number;
  id: string;
  rank: string;
  tier: number;
  percentile: number;
  leaderboardPlace: number;
}

export interface CardCast {
  grpId: number;
  turn: number;
  player: number;
}

export interface PriorityTimers {
  last: number;
  timers: number[];
}

export interface MatchData {
  zones: { [key: string]: ZoneType };
  player: MatchPlayer;
  opponent: MatchPlayer;
  players: { [key: number]: PlayerData };
  bestOf: number;
  game: number;
  beginTime: Date;
  gameStage: string;
  playerCardsLeft: Deck;
  annotations: AnnotationInfo[];
  processedAnnotations: number[];
  gameObjs: { [key: number]: GameObject };
  turnInfo: TurnInfo;
  priorityTimers: PriorityTimers;
  currentPriority: number;
  cardsCast: CardCast[];
  latestMessage: number;
  msgId: number;
  GREtoClient: GREToClientMessage[];
  cardTypesByZone: ZoneData;
  playerCardsUsed: number[];
  oppCardsUsed: number[];
  gameInfo: GameInfo;
  results: Result[];
  onThePlay: number;
  matchId: string;
  matchTime: number;
  playerChances: Chances;
  playerCardsOdds: Chances;
  oppCards: Deck;
  eventId: string;
  InternalEventName?: string;
  oppArchetype: string;
}

export interface DeckChanges {
  added: number[];
  removed: number[];
}

export interface MatchGameStats {
  time: number;
  winner: number;
  handsDrawn: number[][];
  cardsCast: CardCast[];
  sideboardChanges: DeckChanges;
  deck: InternalDeck;
  cardsSeen: number[];
  onThePlay: number;
}
