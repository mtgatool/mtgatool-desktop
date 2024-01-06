import { TurnInfo } from "mtgatool-shared/dist/types/greTypes";

export type ActionLogLineType =
  | "START"
  | "END"
  | "CONCEDED"
  | "TIMED_OUT"
  | "WIN"
  | "TURN_INFO"
  | "DRAW"
  | "CAST"
  | "DISCARD"
  | "PLAY"
  | "ZONE_PUT"
  | "ZONE_RETURN"
  | "EXILE"
  | "COUNTERED"
  | "DESTROYED"
  | "ABILITY"
  | "ATTACK"
  | "DAMAGE_DEALT"
  | "MODIFIED_LIFE"
  | "TARGET"
  | "SCRY"
  | "REVEAL";

export interface ActionLogLineBase {
  timestamp: number;
  seat: number;
  type: ActionLogLineType;
}

export interface ActionLogLineStart extends ActionLogLineBase {
  type: "START";
}

export interface ActionLogLineEnd extends ActionLogLineBase {
  type: "END";
}

export interface ActionLogLineConceded extends ActionLogLineBase {
  type: "CONCEDED";
}

export interface ActionLogLineTimedOut extends ActionLogLineBase {
  type: "TIMED_OUT";
}

export interface ActionLogLineWin extends ActionLogLineBase {
  type: "WIN";
}

export interface ActionLogLineTurnInfo extends ActionLogLineBase, TurnInfo {
  type: "TURN_INFO";
  subType: "BEGIN" | "STEP" | "PHASE" | "PRIORITY";
}

export interface ActionLogLineDraw extends ActionLogLineBase {
  type: "DRAW";
  grpId: number | null;
}

export interface ActionLogLineCast extends ActionLogLineBase {
  type: "CAST";
  grpId: number;
}

export interface ActionLogLineDiscard extends ActionLogLineBase {
  type: "DISCARD";
  grpId: number;
}

export interface ActionLogLinePlay extends ActionLogLineBase {
  type: "PLAY";
  grpId: number;
}

export interface ActionLogLineZonePut extends ActionLogLineBase {
  type: "ZONE_PUT";
  sourceGrpId: number;
  abilityId: number | undefined;
  grpId: number;
  zone: string;
}

export interface ActionLogLineZoneReturn extends ActionLogLineBase {
  type: "ZONE_RETURN";
  sourceGrpId: number;
  abilityId: number | undefined;
  grpId: number;
  zone: string;
}

export interface ActionLogLineExile extends ActionLogLineBase {
  type: "EXILE";
  sourceGrpId: number;
  abilityId: number | undefined;
  grpId: number;
}

export interface ActionLogLineCountered extends ActionLogLineBase {
  type: "COUNTERED";
  sourceGrpId: number;
  abilityId: number | undefined;
  grpId: number;
}

export interface ActionLogLineDestroyed extends ActionLogLineBase {
  type: "DESTROYED";
  sourceGrpId: number;
  abilityId: number | undefined;
  grpId: number;
}

export interface ActionLogLineAbility extends ActionLogLineBase {
  type: "ABILITY";
  sourceGrpId: number;
  abilityId: number;
}

export interface ActionLogLineAttack extends ActionLogLineBase {
  type: "ATTACK";
  grpIds: number[];
  targetType: string;
  targetId: number;
}

export interface ActionLogLineDamageDealt extends ActionLogLineBase {
  type: "DAMAGE_DEALT";
  sourceGrpId: number;
  amount: number;
  targetType: string;
  targetId: number;
}

export interface ActionLogLineModifiedLife extends ActionLogLineBase {
  type: "MODIFIED_LIFE";
  delta: number;
  total: number;
}

export interface ActionLogLineTarget extends ActionLogLineBase {
  type: "TARGET";
  sourceGrpId: number;
  abilityId: number | undefined;
  targetType: string;
  targetId: number;
}

export interface ActionLogLineScry extends ActionLogLineBase {
  type: "SCRY";
  amount: number;
  top: number[];
  bottom: number[];
}

export interface ActionLogLineReveal extends ActionLogLineBase {
  type: "REVEAL";
  grpId: number;
  zone: string;
}

export type ActionLogLine =
  | ActionLogLineStart
  | ActionLogLineEnd
  | ActionLogLineConceded
  | ActionLogLineTimedOut
  | ActionLogLineWin
  | ActionLogLineTurnInfo
  | ActionLogLineDraw
  | ActionLogLineCast
  | ActionLogLineDiscard
  | ActionLogLinePlay
  | ActionLogLineZonePut
  | ActionLogLineZoneReturn
  | ActionLogLineExile
  | ActionLogLineCountered
  | ActionLogLineDestroyed
  | ActionLogLineAbility
  | ActionLogLineAttack
  | ActionLogLineDamageDealt
  | ActionLogLineModifiedLife
  | ActionLogLineTarget
  | ActionLogLineScry
  | ActionLogLineReveal;

export interface ActionLogPlayer {
  name: string;
  seat: number;
  userId: string;
}

export type ActionLogV2 = {
  version: number;
  players: ActionLogPlayer[];
  lines: ActionLogLine[];
};

export interface ActionLogLineProps {
  line: ActionLogLine;
  players: ActionLogPlayer[];
  timeStart: number;
}
