import {
  Cards,
  InternalDeck,
  InternalMatch,
  InventoryUpdate,
  OverlaySettingsData,
  PlayerInventory,
} from "mtgatool-shared";

export type MessageType =
  | "START_LOG_READING"
  | "STOP_LOG_READING"
  | "LOG_MESSAGE_RECV"
  | "LOG_READ_FINISHED"
  | "OVERLAY_UPDATE"
  | "OVERLAY_SETTINGS"
  | "GAME_STATS"
  | "UPSERT_GUN_DECK"
  | "UPSERT_GUN_CARDS"
  | "INVENTORY_UPDATED"
  | "PLAYER_INVENTORY"
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
  value: InternalMatch;
}

export interface UpsertGunDeckMessage extends ChannelMessageBase {
  type: "UPSERT_GUN_DECK";
  value: InternalDeck;
}

export interface UpsertGunCardsMessage extends ChannelMessageBase {
  type: "UPSERT_GUN_CARDS";
  value: Cards;
}

export interface InventoryUpdatedMessage extends ChannelMessageBase {
  type: "INVENTORY_UPDATED";
  value: InventoryUpdate;
  context: string;
  id: string;
}

export interface PlayerInventoryMessage extends ChannelMessageBase {
  type: "PLAYER_INVENTORY";
  value: PlayerInventory;
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
  | UpsertGunCardsMessage
  | InventoryUpdatedMessage
  | PlayerInventoryMessage
  | HoverInMessage
  | HoverOutMessage
  | OverlaySettingsMessage;
