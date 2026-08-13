/* eslint-disable radix */

import {
  CardCast,
  InternalPlayer,
  MatchGameStats,
  MatchState,
  PriorityTimers,
} from "../../types";
import Chances from "../../types/chances";
import { DetailsIdChange } from "../../types/greInterpreter";
import {
  AnnotationInfo,
  GameInfo,
  GameObjectInfo,
  GREToClientMessage,
  Phase,
  PlayerInfo,
  TurnInfo,
  ZoneInfo,
} from "../../types/greTypes";
import Deck from "../../utils/mtga/deck";
import globalStore from ".";

interface Heat {
  seat: number;
  value: number;
  turn: number | undefined;
  phase: Phase;
}

/**
 * A brand new match state.
 *
 * A factory, not a shared object — and the difference is not cosmetic. This was
 * once a single `matchStateObject` that `globalStore.currentMatch` was
 * initialised *to*, rather than from. Every setter writes through
 * `globalStore.currentMatch`, so until the first resetCurrentMatch ran, all of
 * them were writing into the defaults themselves; resetCurrentMatch then spread
 * that same object as the starting point for every match afterwards.
 *
 * Normally invisible, because the first MatchGameRoomStateType_Playing fires
 * resetCurrentMatch before any GRE traffic and decouples the defaults while
 * they are still clean. But a match that runs *before* that first reset — the
 * app starting or reloading while a game is already in progress — writes its
 * own msgId, opponent and seen cards into the defaults permanently, and every
 * later match starts life with them. The symptom was an opponent's cards from a
 * match already finished appearing in the next match's deck list, and a msgId
 * that never came back to 0 (which is what a new match is recognised by).
 */
export function createMatchState(): MatchState {
  return {
    matchStarted: false,
    matchId: "",
    eventId: "",
    onThePlay: 0,
    msgId: 0,
    playerSeat: 0,
    oppSeat: 0,
    opponent: {} as InternalPlayer,
    gameWinner: 0,
    statsHeatMap: [] as Heat[],
    totalTurns: 0,
    logTime: new Date(),
    playerStats: {
      lifeGained: 0,
      lifeLost: 0,
      manaUsed: 0,
      damage: {} as Record<string, number>,
      lifeTotals: [] as number[],
    },
    oppStats: {
      lifeGained: 0,
      lifeLost: 0,
      manaUsed: 0,
      damage: {} as Record<string, number>,
      lifeTotals: [] as number[],
    },
    // Decks
    currentDeck: new Deck(),
    originalDeck: new Deck(),
    cardsLeft: new Deck(),
    cardsFromSideboard: [] as number[],
    cardsBottom: [] as number[],
    // Info
    player: {} as InternalPlayer,
    players: [] as PlayerInfo[],
    turnInfo: {} as TurnInfo,
    gameInfo: {
      results: [],
    } as GameInfo,
    // Time stuff
    beginTime: new Date(),
    priorityTimers: {
      last: 0,
      timers: [0, 0, 0, 0, 0] as number[],
    } as PriorityTimers,
    currentPriority: 0,
    // Zones, objects, annotations, ids tracking
    GREtoClient: [] as GREToClientMessage[],
    zones: {} as Record<number, ZoneInfo>,
    annotations: {} as Record<number, AnnotationInfo>,
    processedAnnotations: [] as number[],
    gameObjects: {} as Record<number, GameObjectInfo>,
    initialLibraryInstanceIds: [] as number[],
    instanceToCardIdMap: {} as Record<number, number>,
    idChanges: {} as Record<number, number>,
    cardsCast: [] as CardCast[],
    handsDrawn: [] as number[][],
    matchGameStats: [] as MatchGameStats[],
    cardsOdds: new Chances(),
    missingFromLibrary: [] as number[],
    warpBase: {} as Record<number, number>,
  } as MatchState;
}

export function setMatchId(arg: string): void {
  globalStore.currentMatch.matchId = arg;
}

export function setEventId(arg: string): void {
  globalStore.currentMatch.eventId = arg;
}

export function setPlayer(arg: Partial<InternalPlayer>): void {
  Object.assign(globalStore.currentMatch.player, arg);
}

export function setOpponent(arg: Partial<InternalPlayer>): void {
  Object.assign(globalStore.currentMatch.opponent, arg);
}

export function setPlayerCardsUsed(arg: number[]): void {
  globalStore.currentMatch.player.cardsUsed = arg;
}

export function setMissingFromLibrary(arg: number[]): void {
  globalStore.currentMatch.missingFromLibrary = arg;
}

export function setWarpBase(arg: Record<number, number>): void {
  globalStore.currentMatch.warpBase = arg;
}

// getOppUsedCards() returns only the opponent cards currently sitting in
// visible zones (battlefield, graveyard, ...), so replacing cardsUsed with each
// snapshot made cards flicker in and out of the overlay instead of accumulating
// as they were seen. Accumulate instead, keeping — per card — the MAXIMUM number
// of copies ever visible at once. Repeating a grpId N times in the list means
// "N copies were on screen simultaneously" (removeDuplicates sums those into the
// displayed quantity), which is the best estimate of how many the opponent runs;
// taking the max never inflates the count and never lets a seen card disappear.
function mergeSeenByMax(prev: number[], next: number[]): number[] {
  const count = (list: number[]): Map<number, number> => {
    const map = new Map<number, number>();
    list.forEach((id) => map.set(id, (map.get(id) || 0) + 1));
    return map;
  };
  const a = count(prev);
  const b = count(next);
  const ids = new Set<number>();
  a.forEach((_v, id) => ids.add(id));
  b.forEach((_v, id) => ids.add(id));
  const merged: number[] = [];
  ids.forEach((id) => {
    const n = Math.max(a.get(id) || 0, b.get(id) || 0);
    for (let i = 0; i < n; i += 1) merged.push(id);
  });
  return merged;
}

export function setOppCardsUsed(arg: number[]): void {
  const prev = globalStore.currentMatch.opponent.cardsUsed || [];
  globalStore.currentMatch.opponent.cardsUsed = mergeSeenByMax(prev, arg);
}

export function resetCurrentMatch(): void {
  // Deck selection happens before creating a new match. Need to keep the
  // already selected deck.
  const { currentDeck } = globalStore.currentMatch;
  const { originalDeck } = globalStore.currentMatch;
  // Everything else comes back brand new. This used to spread a shared default
  // object and then rebuild playerStats/oppStats/statsHeatMap/matchGameStats by
  // hand — a patch for those four carrying over between matches, which is the
  // same fault createMatchState now prevents for every field at once.
  globalStore.currentMatch = createMatchState();
  globalStore.currentMatch.currentDeck = currentDeck;
  globalStore.currentMatch.originalDeck = originalDeck;
}

export function resetCurrentGame(): void {
  Object.assign(globalStore.currentMatch, {
    msgId: 0,
    turnInfo: {},
    gameInfo: {
      results: [],
    },
    players: [],
    priorityTimers: {
      last: 0,
      timers: [0, 0, 0, 0, 0],
    },
    cardsFromSideboard: [],
    cardsBottom: [],
    currentPriority: 0,
    zones: {},
    annotations: {},
    processedAnnotations: [],
    gameObjects: {},
    initialLibraryInstanceIds: [],
    instanceToCardIdMap: {},
    idChanges: {},
    handsDrawn: [],
    cardsCast: [],
    missingFromLibrary: [],
    warpBase: {},
  });
  // Seen-cards accumulate within a game (see setOppCardsUsed); clear them at the
  // start of each new game so per-game totals stay separate — the previous
  // game's list has already been captured into matchGameStats by then, and
  // getOpponentDeck sums current cardsUsed + every game's stored cardsSeen.
  // (Opponent identity — name/seat — lives in other fields and is preserved.)
  globalStore.currentMatch.opponent.cardsUsed = [];
}

export function setGameBeginTime(arg: Date): void {
  globalStore.currentMatch.beginTime = arg;
}

export function setMatchStarted(arg: boolean): void {
  globalStore.currentMatch.matchStarted = arg;
}

export function setOnThePlay(arg: number): void {
  globalStore.currentMatch.onThePlay = arg;
}

export function setTurnInfo(arg: Partial<TurnInfo>): void {
  Object.assign(globalStore.currentMatch.turnInfo, arg);
}

export function setCurrentMatchMany(arg: any): void {
  Object.assign(globalStore.currentMatch, arg);
}

export function setPlayers(arg: PlayerInfo[]): void {
  Object.assign(globalStore.currentMatch.players, arg);
}

export function setGameInfo(arg: Partial<GameInfo>): void {
  Object.assign(globalStore.currentMatch.gameInfo, arg);
}

// export function setZone(arg: ZoneInfo): void {
//  globalStore.currentMatch.zones[arg.zoneId || 0] = arg;
// }

export function setManyZones(arg: ZoneInfo[]): void {
  const newZones = { ...globalStore.currentMatch.zones };
  arg.forEach((zone: ZoneInfo) => {
    newZones[zone.zoneId || 0] = zone;
  });
  Object.assign(globalStore.currentMatch.zones, newZones);
}

// export function setAnnotation(arg: AnnotationInfo): void {
//  globalStore.currentMatch.annotations[arg.id || 0] = arg;
// }

export function setManyAnnotations(arg: AnnotationInfo[]): void {
  const newAnn = { ...globalStore.currentMatch.annotations };
  arg.forEach((annotation: AnnotationInfo) => {
    newAnn[annotation.id || 0] = annotation;
  });
  globalStore.currentMatch.annotations = newAnn;
}

export function removeAnnotations(arg: number[]): void {
  const newProcessed = [
    ...globalStore.currentMatch.processedAnnotations,
    ...arg,
  ];
  const newAnn = {} as Record<number, AnnotationInfo>;

  Object.keys(globalStore.currentMatch.annotations).forEach((k: string) => {
    const id = parseInt(k);
    if (!newProcessed.includes(id)) {
      newAnn[id] = globalStore.currentMatch.annotations[id];
    }
  });

  Object.assign(globalStore.currentMatch.annotations, newAnn);
  Object.assign(globalStore.currentMatch.processedAnnotations, newProcessed);
}

/*
export function setGameObject(arg: GameObject): void {
  if (arg.instanceId) {
    globalStore.currentMatch.gameObjects[arg.instanceId] = arg;
    if (arg.grpId) {
      globalStore.currentMatch.instanceToCardIdMap[arg.instanceId] = arg.grpId;
    }
  }
}
*/

export function setManyGameObjects(arg: GameObjectInfo[]): void {
  const newObjs = { ...globalStore.currentMatch.gameObjects } as any;
  arg.forEach((obj: GameObjectInfo) => {
    if (obj.instanceId) {
      newObjs[obj.instanceId] = obj;
      if (obj.grpId) {
        globalStore.currentMatch.instanceToCardIdMap[obj.instanceId] =
          obj.grpId;
      }
    }
  });
  Object.assign(globalStore.currentMatch.gameObjects, newObjs);
}

export function setIdChange(arg: DetailsIdChange): void {
  globalStore.currentMatch.idChanges[arg.orig_id] = arg.new_id;
}

export function addCardCast(arg: CardCast): void {
  globalStore.currentMatch.cardsCast = [
    ...globalStore.currentMatch.cardsCast,
    arg,
  ];
}

/*
export function clearCardsCast(): void {
  globalStore.currentMatch.cardsCast = [];
}
*/

export function setCardsBottom(arg: number[]): void {
  globalStore.currentMatch.cardsBottom = arg;
}

export function addCardFromSideboard(arg: number[]): void {
  globalStore.currentMatch.cardsFromSideboard = [
    ...globalStore.currentMatch.cardsFromSideboard,
    ...arg,
  ];
}

export function setInitialLibraryInstanceIds(arg: number[]): void {
  globalStore.currentMatch.initialLibraryInstanceIds = arg;
}

export function setMatchGameStats(game: number, arg: MatchGameStats): void {
  globalStore.currentMatch.matchGameStats[game] = arg;
}

export function setHandDrawn(hand: number, arg: number[]): void {
  globalStore.currentMatch.handsDrawn[hand] = arg;
}

export function setCardsOdds(arg: Chances): void {
  globalStore.currentMatch.cardsOdds = arg;
}

export function setGameWinner(arg: number): void {
  globalStore.currentMatch.gameWinner = arg;
}
