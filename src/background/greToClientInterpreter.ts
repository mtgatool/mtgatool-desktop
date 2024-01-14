/* eslint-disable camelcase */
/* eslint-disable radix */
/* eslint-disable no-console */
import { app } from "electron";
import { countValues, objectClone, useSet } from "mtgatool-shared";
import {
  AnnotationInfo,
  AnnotationType,
  GameObjectInfo,
  GameStateMessage,
  GREMessageType,
  GREToClientMessage,
  KeyValuePairInfo,
  PlayerInfo,
  TurnInfo,
  ZoneInfo,
  ZoneType,
} from "mtgatool-shared/dist/types/greTypes";

import {
  AggregatedDetailsType,
  Annotations,
  DetailsKeyType,
  DetailsSrcDestCategoryType,
} from "../types/greInterpreter";
import db from "../utils/database-wrapper";
import actionLog from "./actionLog";
import forceDeckUpdate from "./forceDeckUpdate";
import getMatchGameStats from "./getMatchGameStats";
import globalStore from "./store";
import {
  addCardCast,
  addCardFromSideboard,
  removeAnnotations,
  resetCurrentGame,
  setCardsBottom,
  setCurrentMatchMany,
  setGameBeginTime,
  setGameInfo,
  setGameWinner,
  setHandDrawn,
  setIdChange,
  setInitialLibraryInstanceIds,
  setManyAnnotations,
  setManyGameObjects,
  setManyZones,
  setMatchId,
  setMatchStarted,
  setOnThePlay,
  setOppCardsUsed,
  setPlayerCardsUsed,
  setPlayers,
  setTurnInfo,
} from "./store/currentMatchStore";
import updateDeck from "./updateDeck";

function changePriority(previous: number, current: number, time: number): void {
  const priorityTimers = objectClone(globalStore.currentMatch.priorityTimers);
  priorityTimers.timers[previous] += time - priorityTimers.last;
  priorityTimers.last = globalStore.currentMatch.logTime.getTime();

  console.log("changePriority", previous, priorityTimers, time);

  setCurrentMatchMany({
    priorityTimers: priorityTimers,
    currentPriority: current,
  });
}

function _setHeat(seat: number, value: number): void {
  const { turnInfo } = globalStore.currentMatch;
  const heat = {
    value,
    seat,
    turn: turnInfo.turnNumber,
    phase: turnInfo.phase || "Phase_None",
  };
  const lastN = globalStore.currentMatch.statsHeatMap.length - 1;
  const lastItem = globalStore.currentMatch.statsHeatMap[lastN];
  if (
    lastItem &&
    lastItem.seat == seat &&
    lastItem.turn == turnInfo.turnNumber &&
    lastItem.phase == turnInfo.phase
  ) {
    globalStore.currentMatch.statsHeatMap[lastN].value += value;
  } else {
    globalStore.currentMatch.statsHeatMap.push(heat);
  }
}

function getGameObject(id: number): GameObjectInfo {
  return globalStore.currentMatch.gameObjects[id];
}

function getZone(id: number): ZoneInfo {
  return globalStore.currentMatch.zones[id];
}

function getPlayer(seat: number): PlayerInfo | undefined {
  return globalStore.currentMatch.players.filter(
    (player) => player.systemSeatNumber == seat
  )[0];
}

function getZoneByType(
  type: ZoneInfo["type"],
  seat: number
): ZoneInfo | undefined {
  const { currentMatch } = globalStore;
  let ret;
  Object.values(currentMatch.zones).forEach((zone) => {
    if (zone.type == type && zone.ownerSeatId == seat) {
      ret = zone;
    }
  });
  return ret;
}

function getZoneName(type: ZoneType): string {
  return type.replace("ZoneType_", "");
}

function getAllAnnotations(): AnnotationInfo[] {
  const { annotations } = globalStore.currentMatch;
  return Object.values(annotations);
}

function isAnnotationProcessed(id: number): boolean {
  const anns = globalStore.currentMatch.processedAnnotations;
  return anns.includes(id);
}

const FACE_DOWN_CARD = 3;

function isObjectACard(card: GameObjectInfo): boolean {
  return (
    card.type == "GameObjectType_Card" ||
    card.type == "GameObjectType_SplitCard"
  );
}

class NoInstanceException {
  // private message: string;
  private instanceID: number;

  private instance: GameObjectInfo;

  constructor(orig: number, instanceID: number, instance: GameObjectInfo) {
    this.instanceID = instanceID;
    this.instance = instance;
    if (!app.isPackaged) {
      console.info(`No instance with ID ${orig} found. (${this.instanceID})`);
    }
  }
}

function instanceIdToObject(iid: number): GameObjectInfo {
  let instanceID = iid;
  const orig = instanceID;
  const { idChanges } = globalStore.currentMatch;
  while (!getGameObject(instanceID) && idChanges[instanceID]) {
    instanceID = idChanges[instanceID];
  }

  const instance = getGameObject(instanceID);
  if (instance) {
    return instance;
  }
  throw new NoInstanceException(orig, instanceID, instance);
}

const AnnotationType_ObjectIdChanged = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_ObjectIdChanged") return;
  // let newObj = cloneDeep(getGameObject(details.orig_id));
  // getGameObject(details.new_id) = newObj;
  setIdChange(ann.details);
};

// eslint-disable-next-line complexity
const AnnotationType_ZoneTransfer = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_ZoneTransfer") return;

  // Capture cards that travel from the sideboard
  const fromZone = getZone(ann.details.zone_src);
  if (fromZone.type == "ZoneType_Sideboard") {
    const obj = instanceIdToObject(ann.affectedIds[0]);
    if (obj.ownerSeatId == globalStore.currentMatch.playerSeat && obj.grpId) {
      addCardFromSideboard([obj.grpId]);
    }
  }

  // A player played a land
  if (ann.details.category == "PlayLand") {
    const affected = instanceIdToObject(ann.affectedIds[0]);
    const grpId = affected.grpId || 0;

    actionLog({
      seat: affected.controllerSeatId || 0,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "PLAY",
      grpId,
    });
  }

  // A player drew a card
  if (ann.details.category == "Draw") {
    const zone = getZone(ann.details.zone_src);
    const obj = getGameObject(ann.affectedIds[0]);
    const { playerSeat } = globalStore.currentMatch;
    if (zone.ownerSeatId == playerSeat && obj && obj.grpId) {
      actionLog({
        seat: zone.ownerSeatId,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "DRAW",
        grpId: obj.grpId,
      });
    } else {
      actionLog({
        seat: zone.ownerSeatId || 0,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "DRAW",
        grpId: null,
      });
    }
  }

  // A player casts a spell
  if (ann.details.category == "CastSpell") {
    const obj = instanceIdToObject(ann.affectedIds[0]) as GameObjectInfo;
    const grpId = obj.grpId || 0;
    const seat = obj.ownerSeatId || 0;
    const { turnNumber } = globalStore.currentMatch.turnInfo;

    // console.log("CAST", grpId, obj, ann);
    const cast = {
      grpId: grpId,
      turn: turnNumber || 0,
      player: seat,
    };
    addCardCast(cast);

    actionLog({
      seat: obj.controllerSeatId || seat,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "CAST",
      grpId,
    });
  }

  // A player discards a card
  if (ann.details.category == "Discard") {
    const obj = instanceIdToObject(ann.affectedIds[0]);
    const grpId = obj.grpId || 0;
    const seat = obj.ownerSeatId || 0;

    actionLog({
      seat: seat,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "DISCARD",
      grpId,
    });
  }

  // A player puts a card in a zone
  if (ann.details.category == "Put") {
    const zone = getZone(ann.details.zone_dest).type;
    const obj = instanceIdToObject(ann.affectedIds[0]);
    const { grpId } = obj;
    const affector = instanceIdToObject(ann.affectorId);
    const seat = obj.ownerSeatId || 0;

    if (affector.type == "GameObjectType_Ability" && grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "ZONE_PUT",
        sourceGrpId: affector.objectSourceGrpId || 0,
        abilityId: affector.grpId,
        grpId,
        zone: getZoneName(zone || "ZoneType_None"),
      });
    }
    if (isObjectACard(affector) && grpId && affector.grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "ZONE_PUT",
        sourceGrpId: affector.grpId,
        abilityId: undefined,
        grpId,
        zone: getZoneName(zone || "ZoneType_None"),
      });
    }
  }

  // A card is returned to a zone
  if (ann.details.category == "Return") {
    const zone = getZone(ann.details.zone_dest).type;
    const affected = instanceIdToObject(ann.affectedIds[0]);
    const affector = instanceIdToObject(ann.affectorId);
    const seat = affected.ownerSeatId || 0;

    if (
      affector.type == "GameObjectType_Ability" &&
      affected.grpId &&
      affector.objectSourceGrpId
    ) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "ZONE_RETURN",
        sourceGrpId: affector.objectSourceGrpId,
        abilityId: affector.grpId,
        grpId: affected.grpId,
        zone: getZoneName(zone || "ZoneType_None"),
      });
    }
    if (isObjectACard(affector) && affected.grpId && affector.grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "ZONE_RETURN",
        sourceGrpId: affector.grpId,
        abilityId: undefined,
        grpId: affected.grpId,
        zone: getZoneName(zone || "ZoneType_None"),
      });
    }
  }

  // A card was exiled
  if (ann.details.category == "Exile") {
    const affected = instanceIdToObject(ann.affectedIds[0]);
    const affector = instanceIdToObject(ann.affectorId);

    const seat = affector.ownerSeatId || 0;

    if (
      affector.type == "GameObjectType_Ability" &&
      affector.objectSourceGrpId &&
      affected.grpId
    ) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "EXILE",
        sourceGrpId: affector.objectSourceGrpId,
        abilityId: affector.grpId,
        grpId: affected.grpId,
      });
    }
    if (isObjectACard(affector) && affected.grpId && affector.grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "EXILE",
        sourceGrpId: affector.grpId,
        abilityId: undefined,
        grpId: affected.grpId,
      });
    }
  }

  // Saw this one when Lava coil exiled a creature (??)
  if (ann.details.category == "SBA_Damage") {
    //
  }

  // A spell or ability counters something
  if (ann.details.category == "Countered") {
    const affector = instanceIdToObject(ann.affectorId);
    const affected = instanceIdToObject(ann.affectedIds[0]);

    const seat = affector.ownerSeatId || 0;
    if (
      affector.type == "GameObjectType_Ability" &&
      affector.objectSourceGrpId &&
      affected.grpId
    ) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "COUNTERED",
        sourceGrpId: affector.objectSourceGrpId,
        abilityId: affector.grpId,
        grpId: affected.grpId,
      });
    }
    if (isObjectACard(affector) && affected.grpId && affector.grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "COUNTERED",
        sourceGrpId: affector.grpId,
        abilityId: undefined,
        grpId: affected.grpId,
      });
    }
  }

  // A spell or ability destroys something
  if (ann.details.category == "Destroy") {
    const affector = instanceIdToObject(ann.affectorId);
    const affected = instanceIdToObject(ann.affectedIds[0]);

    const seat = affector.ownerSeatId || 0;
    if (
      affector.type == "GameObjectType_Ability" &&
      affector.objectSourceGrpId &&
      affected.grpId
    ) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "DESTROYED",
        sourceGrpId: affector.objectSourceGrpId,
        abilityId: affector.grpId,
        grpId: affected.grpId,
      });
    }
    if (isObjectACard(affector) && affected.grpId && affector.grpId) {
      actionLog({
        seat: seat,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "DESTROYED",
        sourceGrpId: affector.grpId,
        abilityId: undefined,
        grpId: affected.grpId,
      });
    }
  }
};

const AnnotationType_AbilityInstanceCreated = (ann: Annotations): void => {
  return;
  if (ann.type !== "AnnotationType_AbilityInstanceCreated") return;

  /* 
  const affected = ann.affectedIds[0];
  const affector = instanceIdToObject(ann.affectorId);
  if (affector) {
    //currentMatch.gameObjs[affected]
    const newObj = {
      type: "GameObjectType_Ability",
      instanceId: affected,
      grpId: affector.grpId,
      zoneId: affector.zoneId,
      visibility: "Visibility_Public",
      ownerSeatId: affector.ownerSeatId,
      controllerSeatId: affector.controllerSeatId,
      objectSourceGrpId: affector.grpId,
      parentId: affector.instanceId
    } as GameObjectTypeAbility;
    setGameObj(newObj);
  }
  */
};

const AnnotationType_ResolutionStart = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_ResolutionStart") return;
  const affected = instanceIdToObject(ann.affectedIds[0]);
  const grpId = ann.details.grpid;

  if (
    affected.type == "GameObjectType_Ability" &&
    affected.controllerSeatId &&
    affected.objectSourceGrpId
  ) {
    // affected.grpId = grpId;
    actionLog({
      seat: affected.controllerSeatId,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "ABILITY",
      sourceGrpId: affected.objectSourceGrpId,
      abilityId: grpId,
    });
  }
};

const AnnotationType_DamageDealt = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_DamageDealt") return;

  let targetId = 0;
  let targetType = "PERMANENT";

  if (ann.affectedIds[0] < 5) {
    [targetId] = ann.affectedIds;
    targetType = "PLAYER";
  } else {
    const affected = instanceIdToObject(ann.affectedIds[0]);
    targetId = affected.grpId || 0;
    targetType = "PERMANENT";
  }

  const affector = instanceIdToObject(ann.affectorId);
  const dmg = ann.details.damage;
  const affectorGrpId = affector.grpId || 0;

  if (affector.controllerSeatId == globalStore.currentMatch.playerSeat) {
    const pstats = globalStore.currentMatch.playerStats;

    const prev = pstats.damage[affectorGrpId];
    pstats.damage[affectorGrpId] = (prev || 0) + dmg;
  } else {
    const pstats = globalStore.currentMatch.oppStats;

    const prev = pstats.damage[affectorGrpId];
    pstats.damage[affectorGrpId] = (prev || 0) + dmg;
  }

  actionLog({
    seat: affector.controllerSeatId || 0,
    timestamp: globalStore.currentMatch.logTime.getTime(),
    type: "DAMAGE_DEALT",
    sourceGrpId: affectorGrpId,
    targetId,
    targetType,
    amount: dmg,
  });
};

const AnnotationType_ModifiedLife = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_ModifiedLife") return;
  const affected = ann.affectedIds[0];
  const total = getPlayer(affected)?.lifeTotal || 0 + ann.details.life;
  // const lifeStr = (ann.details.life > 0 ? "+" : "") + ann.details.life;

  const lifeAbs = Math.abs(ann.details.life);
  if (affected == globalStore.currentMatch.playerSeat) {
    if (ann.details.life > 0)
      globalStore.currentMatch.playerStats.lifeGained += lifeAbs;
    else globalStore.currentMatch.playerStats.lifeLost += lifeAbs;
    globalStore.currentMatch.playerStats.lifeTotals.push(Math.max(0, total));
  } else {
    if (ann.details.life > 0)
      globalStore.currentMatch.oppStats.lifeGained += lifeAbs;
    else globalStore.currentMatch.oppStats.lifeLost += lifeAbs;
    globalStore.currentMatch.oppStats.lifeTotals.push(Math.max(0, total));
  }

  actionLog({
    seat: affected,
    timestamp: globalStore.currentMatch.logTime.getTime(),
    type: "MODIFIED_LIFE",
    delta: ann.details.life,
    total,
  });
};

const AnnotationType_TargetSpec = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_TargetSpec") return;

  let targetId = 0;
  let targetType = "PERMANENT";

  if (ann.affectedIds[0] < 5) {
    [targetId] = ann.affectedIds;
    targetType = "PLAYER";
  } else {
    const affected = instanceIdToObject(ann.affectedIds[0]);
    targetId = affected.grpId || 0;
    targetType = "PERMANENT";
  }

  const affector = instanceIdToObject(ann.affectorId);
  const seat = affector.ownerSeatId || 0;

  if (affector.type == "GameObjectType_Ability" && affector.objectSourceGrpId) {
    actionLog({
      seat,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "TARGET",
      sourceGrpId: affector.objectSourceGrpId,
      abilityId: affector.grpId,
      targetType,
      targetId,
    });
  }
  if (isObjectACard(affector) && affector.grpId) {
    actionLog({
      seat,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "TARGET",
      sourceGrpId: affector.grpId,
      abilityId: undefined,
      targetType,
      targetId,
    });
  }
};

const AnnotationType_Scry = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_Scry") return;
  // REVIEW SCRY ANNOTATION
  let affector: GameObjectInfo | undefined;
  if (ann.affectorId > 3) {
    affector = instanceIdToObject(ann.affectorId);
  }
  // const { playerSeat } = globalStore.currentMatch;

  const top = ann.details.topIds;
  const bottom = ann.details.bottomIds;

  let newTop: number[] = [];
  let newBottom: number[] = [];
  if (!Array.isArray(top)) {
    newTop = top !== undefined ? [top] : [];
  }
  if (!Array.isArray(bottom)) {
    newBottom = bottom !== undefined ? [bottom] : [];
  }
  const xtop = newTop.length;
  const xbottom = newBottom.length;
  const scrySize = xtop + xbottom;

  actionLog({
    seat: affector?.ownerSeatId || ann.affectorId || 0,
    timestamp: globalStore.currentMatch.logTime.getTime(),
    type: "SCRY",
    amount: scrySize,
    top: newTop,
    bottom: newBottom,
  });

  // if (affector == playerSeat) {
  //   if (xtop > 0) {
  //     newTop.forEach((instanceId: number) => {
  //       const { grpId } = instanceIdToObject(instanceId);
  //       actionLog(
  //         affector,
  //         globalStore.currentMatch.logTime,
  //         ` ${actionLogGenerateLink(grpId)} to the top`,
  //         grpId
  //       );
  //     });
  //   }
  //   if (xbottom > 0) {
  //     newBottom.forEach((instanceId: number) => {
  //       const { grpId } = instanceIdToObject(instanceId);
  //       actionLog(
  //         affector,
  //         globalStore.currentMatch.logTime,
  //         ` ${actionLogGenerateLink(grpId)} to the bottom`,
  //         grpId
  //       );
  //     });
  //   }
  // }
};

const AnnotationType_CardRevealed = (ann: Annotations): void => {
  const { playerSeat } = globalStore.currentMatch;
  if (ann.type !== "AnnotationType_CardRevealed") return;
  if (!ann.ignoreForSeatIds.includes(playerSeat)) return;

  ann.affectedIds.forEach((grpId: number) => {
    const zone = getZone(ann.details.source_zone);
    const owner = zone.ownerSeatId || 0;

    actionLog({
      seat: owner,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "REVEAL",
      grpId,
      zone: getZoneName(zone.type || "ZoneType_None"),
    });
  });
};

const AnnotationType_ManaPaid = (ann: Annotations): void => {
  if (ann.type !== "AnnotationType_ManaPaid") return;
  const { playerSeat } = globalStore.currentMatch;

  let affector = ann.affectorId;
  if (affector > 3) {
    affector = instanceIdToObject(affector).ownerSeatId || 0;
  }

  if (affector == playerSeat) {
    globalStore.currentMatch.playerStats.manaUsed += 1;
  } else {
    globalStore.currentMatch.oppStats.manaUsed += 1;
  }
};

function annotationsSwitch(ann: Annotations, type: AnnotationType): void {
  console.log(type, ann);
  switch (type) {
    case "AnnotationType_ObjectIdChanged":
      AnnotationType_ObjectIdChanged(ann);
      break;
    case "AnnotationType_ZoneTransfer":
      AnnotationType_ZoneTransfer(ann);
      break;
    case "AnnotationType_AbilityInstanceCreated":
      AnnotationType_AbilityInstanceCreated(ann);
      break;
    case "AnnotationType_ResolutionStart":
      AnnotationType_ResolutionStart(ann);
      break;
    case "AnnotationType_DamageDealt":
      AnnotationType_DamageDealt(ann);
      break;
    case "AnnotationType_ModifiedLife":
      AnnotationType_ModifiedLife(ann);
      break;
    case "AnnotationType_TargetSpec":
      AnnotationType_TargetSpec(ann);
      break;
    case "AnnotationType_Scry":
      AnnotationType_Scry(ann);
      break;
    case "AnnotationType_CardRevealed":
      AnnotationType_CardRevealed(ann);
      break;
    case "AnnotationType_ManaPaid":
      AnnotationType_ManaPaid(ann);
      break;
    default:
      break;
  }
}

function extractNumberArrayFromKVP(obj: KeyValuePairInfo): number[] {
  switch (obj.type) {
    case "KeyValuePairValueType_uint32":
      return obj.valueUint32;
    case "KeyValuePairValueType_int32":
      return obj.valueInt32;
    case "KeyValuePairValueType_uint64":
      return obj.valueUint64;
    case "KeyValuePairValueType_int64":
      return obj.valueInt64;
    case "KeyValuePairValueType_float":
      return obj.valueFloat;
    case "KeyValuePairValueType_double":
      return obj.valueDouble;
    default:
      return [];
  }
}

function extractNumberValueFromKVP(obj: KeyValuePairInfo): number | undefined {
  const numberArray = extractNumberArrayFromKVP(obj);

  return numberArray.length === 1 ? numberArray[0] : undefined;
}

function extractStringValueFromKVP(obj: KeyValuePairInfo): string | undefined {
  return obj.valueString.length === 1 ? obj.valueString[0] : undefined;
}

/*
function extractBooleanValueFromKVP(
  obj: KeyValuePairInfo
): boolean | undefined {
  return obj.valueBool.length === 1 ? obj.valueBool[0] : undefined;
}

function extractBooleanArrayFromKVP(obj: KeyValuePairInfo): boolean[] {
  return obj.valueBool;
}

function extractStringArrayFromKVP(obj: KeyValuePairInfo): string[] {
  return obj.valueString;
}
*/

function keyValuePair(kvp: KeyValuePairInfo[]): AggregatedDetailsType {
  const aggregate: AggregatedDetailsType = {
    abilityGrpId: 0,
    abilityGRPIDs: [0],
    id: 0,
    color: 0,
    bottomIds: undefined,
    category: undefined,
    damage: 0,
    grpid: 0,
    index: 0,
    life: 0,
    new_id: 0,
    orig_id: 0,
    phase: 0,
    source_zone: 0,
    step: 0,
    topIds: undefined,
    type: 0,
    isTop: 0,
    zone_dest: 0,
    zone_src: 0,
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const obj of kvp) {
    const key = obj.key as DetailsKeyType | undefined;
    switch (key) {
      case undefined:
        break;
      case "id":
      case "color":
      case "abilityGrpId":
      case "grpid":
      case "damage":
      case "index":
      case "life":
      case "new_id":
      case "orig_id":
      case "phase":
      case "source_zone":
      case "step":
      case "type":
      case "zone_dest":
      case "zone_src":
      case "isTop":
        aggregate[key] = extractNumberValueFromKVP(obj) ?? 0;
        break;
      case "abilityGRPIDs":
        aggregate[key] = extractNumberArrayFromKVP(obj) ?? [0];
        break;
      case "bottomIds":
      case "topIds":
        aggregate[key] = extractNumberValueFromKVP(obj);
        break;
      case "category":
        aggregate[key] = extractStringValueFromKVP(
          obj
        ) as DetailsSrcDestCategoryType;
        break;
      default:
        break;
    }
  }
  return aggregate;
}

function processAnnotations(): void {
  const removeIds = [] as number[];
  const anns = getAllAnnotations();
  anns.forEach((ann) => {
    if (ann.id && isAnnotationProcessed(ann.id)) return;

    // Details can be undefined sometimes
    const details = keyValuePair(ann.details || []);

    try {
      ann.type.forEach((type: AnnotationType) => {
        annotationsSwitch(
          { ...ann, type: type, details: details } as Annotations,
          type
        );
        // add this annotation to the list of processed
        removeIds.push(ann.id || 0);
      });
    } catch (e) {
      // debugLog(ann, e);
    }
  });
  // debugLog(anns.length, removeIds.length);
  if (removeIds.length > 0) {
    removeAnnotations(removeIds);
  }
}

function getOppUsedCards(): number[] {
  const cardsUsed: number[] = [];
  const { oppSeat } = globalStore.currentMatch;
  Object.keys(globalStore.currentMatch.zones).forEach((key) => {
    const zone = getZone(parseInt(key));
    const zoneType = (zone.type || "ZoneType_None").trim();
    if (zone.objectInstanceIds && zoneType !== "ZoneType_Limbo") {
      zone.objectInstanceIds.forEach((id: number) => {
        let grpId;
        try {
          const obj = getGameObject(id);
          if (obj.ownerSeatId == oppSeat && isObjectACard(obj)) {
            grpId = obj.grpId;
            // debugLog(zone.type, db.card(grpId).name, obj);
            if (grpId && grpId !== FACE_DOWN_CARD) cardsUsed.push(grpId);
          }
        } catch (e) {
          //
        }
      });
    }
  });
  return cardsUsed;
}

/*
function onlyUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index;
}

function getCardsTypeZone(): ZoneData {
  const data: ZoneData = {};
  Object.keys(globalStore.currentMatch.zones).forEach(key => {
    const zone = getZone(key);
    const zoneType = zone.type;
    if (zone.objectInstanceIds) {
      zone.objectInstanceIds.forEach((id: number) => {
        try {
          const obj = getGameObject(id);
          if (
            (obj.type == "GameObjectType_Card" ||
              obj.type == "GameObjectType_SplitCard") &&
            obj.grpId !== FACE_DOWN_CARD
          ) {
            const cardTypes = obj.cardTypes.filter(onlyUnique);
            cardTypes
              .filter((cardType: string) => cardTypes.includes(cardType))
              .forEach((cardType: string) => {
                const grpId = obj.grpId;
                const owner = obj.controllerSeatId;
                if (!data[owner]) data[owner] = {};
                if (!data[owner][zoneType]) data[owner][zoneType] = {};
                if (!data[owner][zoneType][cardType])
                  data[owner][zoneType][cardType] = [];

                data[owner][zoneType][cardType].push(grpId);
              });
          }
        } catch (e) {
          //
        }
      });
    }
  });

  return data;
}
*/

function getPlayerUsedCards(): number[] {
  const cardsUsed: number[] = [];
  const { playerSeat } = globalStore.currentMatch;
  Object.keys(globalStore.currentMatch.zones).forEach((key) => {
    const zone = getZone(parseInt(key));
    const zoneType = (zone.type || "ZoneType_None").trim();
    const ignoreZones = [
      "ZoneType_Limbo",
      "ZoneType_Library",
      "ZoneType_Sideboard",
      "ZoneType_Revealed",
    ];
    if (zone.objectInstanceIds && !ignoreZones.includes(zoneType)) {
      zone.objectInstanceIds.forEach((id: number) => {
        let grpId: number;
        try {
          const obj = getGameObject(id);
          if (
            obj.ownerSeatId == playerSeat &&
            isObjectACard(obj) &&
            obj.grpId &&
            obj.type == "GameObjectType_Card"
          ) {
            grpId = obj.grpId;
            if (grpId !== FACE_DOWN_CARD) {
              // If this card has mutations (or inherited abilities)
              if (obj.abilityOriginalCardGrpIds && obj.abilities) {
                // For each original grpId (no duplicates)
                const origCards = useSet(obj.abilityOriginalCardGrpIds);
                // debugLog("set: ", origCards);
                origCards.forEach((setCardId) => {
                  const cardObj = db.card(setCardId);
                  // debugLog("> " + setCardId, cardObj);
                  if (cardObj) {
                    // Count the number of times this card is in the parent
                    // This assumes abilities appear just once per card, so
                    // abilities will apear as many times as this card exists
                    const count = countValues(
                      obj.abilities,
                      cardObj.AbilityIds[0] || -1
                    );
                    // Add these to the list of cards used
                    for (let ii = 0; ii < count; ii += 1) {
                      cardsUsed.push(setCardId);
                    }
                  }
                });
              } else {
                // Else its jsut a card, add it
                cardsUsed.push(grpId);
              }
            }
          }
        } catch (e) {
          //
        }
      });
    }
  });

  return cardsUsed;
}

/*
const GREMessageType_ConnectResp = (msg: GREToClientMessage): void => {
  const { currentMatch } = globalStore;
  if (
    msg.connectResp?.deckMessage?.deckCards &&
    currentMatch.player.originalDeck == null
  ) {
    const deck = new Deck(undefined, msg.connectResp.deckMessage.deckCards);
    currentMatch.player.originalDeck = deck;
    currentMatch.player.deck = deck.clone();
    currentMatch.playerCardsLeft = deck.clone();
  }
};
*/

const defaultZone: ZoneInfo = {
  zoneId: 0,
  type: "ZoneType_None",
  visibility: "Visibility_None",
  ownerSeatId: 0,
  objectInstanceIds: [],
  viewers: [],
};

function checkForStartingLibrary(gameState?: GameStateMessage): boolean {
  const { currentMatch } = globalStore;
  let zoneHand: ZoneInfo = defaultZone;
  let zoneLibrary: ZoneInfo = defaultZone;

  Object.keys(currentMatch.zones).forEach((key) => {
    const zone = getZone(parseInt(key));
    if (zone.ownerSeatId == currentMatch.playerSeat) {
      if (zone.type == "ZoneType_Hand") {
        zoneHand = zone;
      }
      if (zone.type == "ZoneType_Library") {
        zoneLibrary = zone;
      }
    }
  });

  if (zoneHand.type == "ZoneType_None") return false;
  if (zoneLibrary.type == "ZoneType_None") return false;
  const hand = zoneHand.objectInstanceIds || [];
  const library = zoneLibrary.objectInstanceIds || [];

  // Try to get the mulligans
  // Get from the current gameState msg
  gameState?.players?.forEach((player: PlayerInfo) => {
    if (
      player.controllerSeatId == currentMatch.playerSeat &&
      player.pendingMessageType == "ClientMessageType_MulliganResp"
    ) {
      const mull = player.mulliganCount || 0;
      // If this is the first hand drawn or we made a mulligan
      if (mull > 0 || currentMatch.handsDrawn.length == 0) {
        const drawn = hand.map((n) => getGameObject(n).grpId).filter((n) => n);
        setHandDrawn(mull, drawn as number[]);
        console.log(`Mulligan: ${mull}, ${drawn}`);
      }
    }
  });

  if (currentMatch.gameInfo.stage !== "GameStage_Start") return false;

  // Check that a post-mulligan scry hasn't been done
  if (library.length == 0 || library[library.length - 1] < library[0]) {
    return false;
  }

  if (
    hand.length + library.length ==
    globalStore.currentMatch.currentDeck.getMainboard().count()
  ) {
    if (hand.length >= 2 && hand[0] == hand[1] + 1) hand.reverse();
    setInitialLibraryInstanceIds([...hand, ...library]);
  }

  return true;
}

function checkTurnDiff(turnInfo: TurnInfo): void {
  // console.log("checkTurnDiff", turnInfo.turnNumber, turnInfo);
  const { currentMatch } = globalStore;
  const currentTurnInfo = currentMatch.turnInfo;
  const { currentPriority } = currentMatch;
  if (
    turnInfo.turnNumber &&
    turnInfo.turnNumber == 1 &&
    turnInfo.activePlayer
  ) {
    setOnThePlay(turnInfo.activePlayer);
  }

  if (
    turnInfo.step === "Step_DeclareBlock" &&
    currentTurnInfo.step !== turnInfo.step
  ) {
    // Find all attacking creatures and add it to the action log
    const attackersByTarget: Record<number, number[]> = {};
    if (turnInfo.phase && turnInfo.step === "Step_DeclareBlock") {
      Object.values(globalStore.currentMatch.zones)
        .filter((z) => z.type === "ZoneType_Battlefield")
        .forEach((zone) => {
          if (zone.objectInstanceIds) {
            zone.objectInstanceIds.forEach((id: number) => {
              try {
                const obj = getGameObject(id);
                if (
                  obj.attackState === "AttackState_Attacking" &&
                  obj.grpId &&
                  obj.grpId !== FACE_DOWN_CARD &&
                  obj.attackInfo &&
                  obj.attackInfo.targetId
                ) {
                  const { targetId } = obj.attackInfo;

                  if (attackersByTarget[targetId]) {
                    attackersByTarget[targetId].push(obj.grpId);
                  } else {
                    attackersByTarget[targetId] = [obj.grpId];
                  }
                }
              } catch (e) {
                //
              }
            });
          }
        });
    }

    console.log("attackersByTarget", attackersByTarget);
    Object.entries(attackersByTarget).forEach(([id, attackers]) => {
      let targetId = parseInt(id);
      const targetType = targetId < 5 ? "PLAYER" : "PERMANENT";

      if (targetType == "PERMANENT") {
        const obj = getGameObject(targetId);
        if (obj && obj.grpId) {
          targetId = obj.grpId;
        }
      }

      actionLog({
        type: "ATTACK",
        seat: turnInfo.activePlayer || -1,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        grpIds: attackers,
        targetType,
        targetId,
      });
    });
  }

  if (turnInfo.priorityPlayer !== currentPriority) {
    changePriority(
      currentPriority,
      turnInfo.priorityPlayer || 0,
      currentMatch.logTime.getTime()
    );
  }
  if (currentTurnInfo.turnNumber !== turnInfo.turnNumber) {
    currentMatch.totalTurns += 1;
    actionLog({
      type: "TURN_INFO",
      seat: -1,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      subType: "BEGIN",
      ...turnInfo,
    });
  }
  if (currentTurnInfo.phase !== turnInfo.phase) {
    actionLog({
      type: "TURN_INFO",
      seat: -1,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      subType: "PHASE",
      ...turnInfo,
    });
  }
  if (currentTurnInfo.step !== turnInfo.step) {
    actionLog({
      type: "TURN_INFO",
      seat: -1,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      subType: "STEP",
      ...turnInfo,
    });
  }
}

const GREMessageType_GameStateMessage = (msg: GREToClientMessage): void => {
  const { currentMatch } = globalStore;

  if (msg.msgId) {
    console.log(`Message id > ${msg.msgId} (${currentMatch.msgId})`);

    if (
      !currentMatch.msgId ||
      msg.msgId === 1 ||
      msg.msgId < currentMatch.msgId
    ) {
      // New game, reset per-game fields.
      console.warn("Reset current game");
      resetCurrentGame();
      setGameBeginTime(globalStore.currentMatch.logTime);
    }
    setCurrentMatchMany({ msgId: msg.msgId });
  }

  const gameState = msg.gameStateMessage;
  if (gameState) {
    if (gameState.gameInfo) {
      setGameInfo(gameState.gameInfo);
      if (gameState.gameInfo.matchID) {
        setMatchId(gameState.gameInfo.matchID);
        setMatchStarted(true);
      }
      if (gameState.gameInfo.stage == "GameStage_GameOver") {
        getMatchGameStats();
      }
    }

    if (gameState.turnInfo) {
      checkTurnDiff(gameState.turnInfo);
      setTurnInfo(gameState.turnInfo);
    }
    /*
    // Not used yet
    // Im not sure how but we should be able to see player
    // timeouts and stuff like that using this.
    if (gameState.timers) {
      gameState.timers.forEach(timer => {
        globals.currentMatch.timers[timer.timerId] = timer;
      });
    }
    */
    if (gameState.zones) {
      setManyZones(gameState.zones);
    }

    if (gameState.players) {
      setPlayers(gameState.players);
    }

    if (gameState.gameObjects) {
      setManyGameObjects(gameState.gameObjects);
    }

    if (gameState.annotations) {
      setManyAnnotations(gameState.annotations);
    }
  }

  processAnnotations();
  checkForStartingLibrary(gameState);
  forceDeckUpdate();
  updateDeck();
};

// Some game state messages are sent as queued
const GREMessageType_QueuedGameStateMessage = (
  msg: GREToClientMessage
): void => {
  GREMessageType_GameStateMessage(msg);
};

const GREMessageType_DieRollResultsResp = (msg: GREToClientMessage): void => {
  if (msg.dieRollResultsResp) {
    const highest = msg.dieRollResultsResp.playerDieRolls.reduce((a, b) => {
      if ((a.rollValue ?? 0) > (b.rollValue ?? 0)) {
        return a;
      }
      return b;
    });
    setOnThePlay(highest.systemSeatId || 0);
  }
};

const GREMessageType_IntermissionReq = (msg: GREToClientMessage): void => {
  if (msg.intermissionReq?.result) {
    const result = msg.intermissionReq?.result;
    setGameWinner(result.winningTeamId || 0);
    const winner = result.winningTeamId || 0;
    const loser = result.winningTeamId == 2 ? 1 : 2;

    if (result.reason == "ResultReason_Concede") {
      actionLog({
        seat: loser,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "CONCEDED",
      });
    } else if (result.reason == "ResultReason_Timeout") {
      actionLog({
        seat: loser,
        timestamp: globalStore.currentMatch.logTime.getTime(),
        type: "TIMED_OUT",
      });
    }
    actionLog({
      seat: winner,
      timestamp: globalStore.currentMatch.logTime.getTime(),
      type: "WIN",
    });
  }
  getMatchGameStats();
};

function GREMessagesSwitch(
  message: GREToClientMessage,
  type: GREMessageType | undefined
): void {
  // console.log(`Process: ${message.type} (${message.msgId})`);
  switch (type) {
    case "GREMessageType_QueuedGameStateMessage":
      GREMessageType_QueuedGameStateMessage(message);
      break;
    // case "GREMessageType_ConnectResp":
    //  GREMessageType_ConnectResp(message);
    //  break;
    case "GREMessageType_GameStateMessage":
      GREMessageType_GameStateMessage(message);
      break;
    case "GREMessageType_DieRollResultsResp":
      GREMessageType_DieRollResultsResp(message);
      break;
    case "GREMessageType_IntermissionReq":
      GREMessageType_IntermissionReq(message);
      break;
    default:
      break;
  }
}

// Used for debug only.
/*
export function processAll(): void {
  for (let i = 0; i < globals.currentMatch.latestMessage; i++) {
    const message = globals.currentMatch.GREtoClient[i];
    if (message) {
      GREMessagesSwitch(message, message.type);
    }
  }
  //globals.currentMatch.cardTypesByZone = getCardsTypeZone();
  globals.currentMatch.playerCardsUsed = getPlayerUsedCards();
  globals.currentMatch.oppCardsUsed = getOppUsedCards();
}

export function GREMessageByID(msgId: number, time: Date): void {
  const message = globals.currentMatch.GREtoClient[msgId];
  globalStore.currentMatch.logTime = time;

  GREMessagesSwitch(message, message.type);

  globals.currentMatch.playerCardsUsed = getPlayerUsedCards();
  //globals.currentMatch.cardTypesByZone = getCardsTypeZone();
  globals.currentMatch.oppCardsUsed = globals.currentMatch.opponent.cards.concat(
    getOppUsedCards()
  );
}
*/

export default function GREMessage(message: GREToClientMessage): void {
  globalStore.currentMatch.GREtoClient[message.msgId || 0] = message;
  GREMessagesSwitch(message, message.type);

  // globals.currentMatch.cardTypesByZone = getCardsTypeZone();
  setPlayerCardsUsed(getPlayerUsedCards());
  setOppCardsUsed(getOppUsedCards());

  const zoneLibrary = getZoneByType(
    "ZoneType_Library",
    globalStore.currentMatch.playerSeat
  );
  if (zoneLibrary && zoneLibrary.objectInstanceIds) {
    const iids = zoneLibrary.objectInstanceIds;
    let i = iids.length - 1;
    const onBottom = [];
    while (i > 0) {
      const instance = getGameObject(iids[i])?.grpId;
      if (instance) {
        onBottom.push(instance);
        i -= 1;
      } else {
        i = 0;
      }
    }
    setCardsBottom(onBottom);
  }
  // globals.currentMatch.opponent.cards.concat(getOppUsedCards())
}
