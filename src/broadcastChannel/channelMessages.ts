import {
  Cards,
  InternalDraftv2,
  InternalMatch,
  InventoryUpdate,
} from "mtgatool-shared";

import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings } from "../common/defaultConfig";
import { DbDraftVote, DbInventoryInfo } from "../types/dbTypes";
import { ClientSceneChange } from "../types/logDecoder";

export type MessageType =
  | "POPUP"
  | "LOG_CHECK"
  | "START_LOG_READING"
  | "STOP_LOG_READING"
  | "LOG_MESSAGE_RECV"
  | "LOG_READ_FINISHED"
  | "ACTION_LOG"
  | "SET_UUID"
  | "SET_UUID_DISPLAYNAME"
  | "OVERLAY_UPDATE"
  | "OVERLAY_SET_SETTINGS"
  | "OVERLAY_UPDATE_SETTINGS"
  | "OVERLAY_UPDATE_BOUNDS"
  | "OVERLAY_SETTINGS"
  | "GAME_STATS"
  | "GAME_START"
  | "SET_SCENE"
  | "UPSERT_DB_CARDS"
  | "UPSERT_DB_RANK"
  | "INVENTORY_UPDATED"
  | "PLAYER_INVENTORY"
  | "HOVER_IN"
  | "HOVER_OUT"
  | "DRAFT_STATUS"
  | "DRAFT_VOTES"
  | "DRAFT_END"
  | "UPDATE_ACTIVE_EVENTS"
  | "DAEMON_GET_PLAYER_ID";

export interface ChannelMessageBase {
  type: MessageType;
}

export interface PopupMessage extends ChannelMessageBase {
  type: "POPUP";
  text: string;
  duration: number;
}

export interface LogCheckMessage extends ChannelMessageBase {
  type: "LOG_CHECK";
}

export interface StartLogReadingMessage extends ChannelMessageBase {
  type: "START_LOG_READING";
}

export interface StopLogReadingMessage extends ChannelMessageBase {
  type: "STOP_LOG_READING";
}

export interface ActionLogMessage extends ChannelMessageBase {
  type: "ACTION_LOG";
  value: string;
}

export interface LogMessageRecvMessage extends ChannelMessageBase {
  type: "LOG_MESSAGE_RECV";
  value: any;
}

export interface LogFinishedMessage extends ChannelMessageBase {
  type: "LOG_READ_FINISHED";
}

export interface SetUUIDMessage extends ChannelMessageBase {
  type: "SET_UUID";
  value: string;
}

export interface SetUUIDDisplayNameMessage extends ChannelMessageBase {
  type: "SET_UUID_DISPLAYNAME";
  value: {
    uuid: string;
    displayName?: string;
  };
}

export interface OverlayUpdateMessage extends ChannelMessageBase {
  type: "OVERLAY_UPDATE";
  value: OverlayUpdateMatchState;
}

export interface OverlayUpdateSettingsMessage extends ChannelMessageBase {
  type: "OVERLAY_UPDATE_SETTINGS";
}

export interface OverlaySetSettingsMessage extends ChannelMessageBase {
  type: "OVERLAY_SET_SETTINGS";
  value: { settings: Partial<OverlaySettings>; window: string };
}

export interface OverlayUpdateBoundsMessage extends ChannelMessageBase {
  type: "OVERLAY_UPDATE_BOUNDS";
  value: { bounds: OverlaySettings["bounds"]; window: string };
}

export interface OverlaySettingsMessage extends ChannelMessageBase {
  type: "OVERLAY_SETTINGS";
  value: OverlaySettings;
}

export interface GameStartMessage extends ChannelMessageBase {
  type: "GAME_START";
}

export interface GameStatsMessage extends ChannelMessageBase {
  type: "GAME_STATS";
  value: InternalMatch;
}

export interface SetSceneMessage extends ChannelMessageBase {
  type: "SET_SCENE";
  value: ClientSceneChange;
}

export interface UpsertDbCardsMessage extends ChannelMessageBase {
  type: "UPSERT_DB_CARDS";
  value: Cards;
}

export interface UpsertDbRankMessage extends ChannelMessageBase {
  type: "UPSERT_DB_RANK";
  value: Partial<CombinedRankInfo>;
}

export interface InventoryUpdatedMessage extends ChannelMessageBase {
  type: "INVENTORY_UPDATED";
  value: InventoryUpdate;
  context: string;
  id: string;
}

export interface PlayerInventoryMessage extends ChannelMessageBase {
  type: "PLAYER_INVENTORY";
  value: DbInventoryInfo;
}

export interface HoverInMessage extends ChannelMessageBase {
  type: "HOVER_IN";
  value: number;
}

export interface HoverOutMessage extends ChannelMessageBase {
  type: "HOVER_OUT";
}

export interface DraftStatusMessage extends ChannelMessageBase {
  type: "DRAFT_STATUS";
  value: InternalDraftv2;
}

export interface DraftVotesMessage extends ChannelMessageBase {
  type: "DRAFT_VOTES";
  value: Record<string, DbDraftVote>;
}

export interface DraftEndMessage extends ChannelMessageBase {
  type: "DRAFT_END";
}

export interface UpdateActiveEventsMessage extends ChannelMessageBase {
  type: "UPDATE_ACTIVE_EVENTS";
  value: string[];
}

export interface DaemonGetPlayerId extends ChannelMessageBase {
  type: "DAEMON_GET_PLAYER_ID";
}

export type ChannelMessage =
  | PopupMessage
  | LogCheckMessage
  | StartLogReadingMessage
  | StopLogReadingMessage
  | ActionLogMessage
  | LogMessageRecvMessage
  | LogFinishedMessage
  | SetUUIDMessage
  | SetUUIDDisplayNameMessage
  | OverlayUpdateMessage
  | OverlayUpdateSettingsMessage
  | OverlaySetSettingsMessage
  | OverlayUpdateBoundsMessage
  | GameStatsMessage
  | GameStartMessage
  | SetSceneMessage
  | UpsertDbCardsMessage
  | UpsertDbRankMessage
  | InventoryUpdatedMessage
  | PlayerInventoryMessage
  | HoverInMessage
  | HoverOutMessage
  | OverlaySettingsMessage
  | DraftStatusMessage
  | DraftVotesMessage
  | DraftEndMessage
  | UpdateActiveEventsMessage
  | DaemonGetPlayerId;
