import {
  CardCast,
  Chances,
  Deck,
  Heat,
  InternalDeck,
  InternalPlayer,
  MatchGameStats,
  PriorityTimers,
} from "mtgatool-shared";
import {
  AnnotationInfo,
  GameInfo,
  GameObjectInfo,
  GREToClientMessage,
  PlayerInfo,
  TurnInfo,
  ZoneInfo,
} from "mtgatool-shared/dist/types/greTypes";

export interface MatchState {
  matchStarted: boolean;
  logTime: Date;
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
  currentDeck: Deck;
  originalDeck: Deck;
  cardsLeft: Deck;
  cardsFromSideboard: number[];
  cardsBottom: number[];
  player: InternalPlayer;
  players: PlayerInfo[];
  turnInfo: TurnInfo;
  gameInfo: GameInfo;
  beginTime: Date;
  priorityTimers: PriorityTimers;
  currentPriority: number;
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

export interface OverlayUpdateMatchState
  extends Omit<
    MatchState,
    "GREtoClient" | "annotations" | "processedAnnotations" | "zones"
  > {
  oppCards: InternalDeck;
  playerCardsLeft: InternalDeck;
  playerCardsOdds: Chances;
  playerDeck: InternalDeck;
  playerOriginalDeck: InternalDeck;
  GREtoClient?: MatchState["GREtoClient"];
  annotations?: MatchState["annotations"];
  processedAnnotations?: MatchState["processedAnnotations"];
  zones?: MatchState["zones"];
}
