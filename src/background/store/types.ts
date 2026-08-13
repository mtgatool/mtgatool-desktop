import {
  CardCast,
  Heat,
  InternalDeck,
  InternalPlayer,
  MatchGameStats,
  PriorityTimers,
} from "../../types";
import Chances from "../../types/chances";
import {
  AnnotationInfo,
  GameInfo,
  GameObjectInfo,
  GREToClientMessage,
  PlayerInfo,
  TurnInfo,
  ZoneInfo,
} from "../../types/greTypes";
import Deck from "../../utils/mtga/deck";

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
  /** Cards deduced gone from the library unseen — see greToClientInterpreter. */
  missingFromLibrary: number[];
  /**
   * Per warped grpId, how many copies are still missing. Set by a library
   * search; decremented only when a copy of that card RETURNS from the exile
   * zone into view. A new sighting from anywhere else (a draw, a fetch) is a
   * different copy and leaves the count alone.
   */
  warpBase: Record<number, number>;
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
