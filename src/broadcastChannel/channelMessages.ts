export type MessageType =
  | "START_LOG_READING"
  | "STOP_LOG_READING"
  | "LOG_MESSAGE_RECV"
  | "LOG_READ_FINISHED"
  | "OVERLAY_UPDATE"
  | "GAME_STATS";

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

export interface GameStatsMessage extends ChannelMessageBase {
  type: "GAME_STATS";
  value: any;
}

export type ChannelMessage =
  | StartLogReadingMessage
  | StopLogReadingMessage
  | LogMessageRecvMessage
  | LogFinishedMessage
  | OverlayUpdateMessage
  | GameStatsMessage;
