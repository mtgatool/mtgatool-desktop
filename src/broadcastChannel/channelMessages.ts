import { InternalDeck, OverlaySettingsData } from "mtgatool-shared";

export type MessageType =
  | "START_LOG_READING"
  | "STOP_LOG_READING"
  | "LOG_MESSAGE_RECV"
  | "LOG_READ_FINISHED"
  | "OVERLAY_UPDATE"
  | "OVERLAY_SETTINGS"
  | "GAME_STATS"
  | "UPSERT_GUN_DECK"
  | "HOVER_IN"
  | "HOVER_OUT";

export interface ChannelMessageBase {
  type: MessageType;
}

export interface StartLogReadingMessage extends ChannelMessageBase {
  type: "START_LOG_READING";
}

export interface StopLogReadingMessage extends ChannelMessageBase {
  type: "STOP_LOG_READING";
}

export interface LogMessageRecvMessage extends ChannelMessageBase {
  type: "LOG_MESSAGE_RECV";
  value: any;
}

export interface LogFinishedMessage extends ChannelMessageBase {
  type: "LOG_READ_FINISHED";
}

export interface OverlayUpdateMessage extends ChannelMessageBase {
  type: "OVERLAY_UPDATE";
  value: any;
}

export interface OverlaySettingsMessage extends ChannelMessageBase {
  type: "OVERLAY_SETTINGS";
  value: OverlaySettingsData;
}

export interface GameStatsMessage extends ChannelMessageBase {
  type: "GAME_STATS";
  value: any;
}

export interface UpsertGunDeckMessage extends ChannelMessageBase {
  type: "UPSERT_GUN_DECK";
  value: InternalDeck;
}

export interface HoverInMessage extends ChannelMessageBase {
  type: "HOVER_IN";
  value: number;
}

export interface HoverOutMessage extends ChannelMessageBase {
  type: "HOVER_OUT";
}

export type ChannelMessage =
  | StartLogReadingMessage
  | StopLogReadingMessage
  | LogMessageRecvMessage
  | LogFinishedMessage
  | OverlayUpdateMessage
  | GameStatsMessage
  | UpsertGunDeckMessage
  | HoverInMessage
  | HoverOutMessage
  | OverlaySettingsMessage;
