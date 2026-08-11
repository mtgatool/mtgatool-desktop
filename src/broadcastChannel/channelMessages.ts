import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings } from "../common/defaultConfig";
import { ActionLogV2 } from "../components/action-log-v2/types";
import { OverlaySharePayload } from "../data/liveShareTypes";
import {
  Cards,
  DraftRatings,
  InternalDraftv2,
  InternalMatch,
  InventoryUpdate,
} from "../types";
import { DbDraftVote, DbInventoryInfo } from "../types/dbTypes";
import { ClientSceneChange } from "../types/logDecoder";

export type MessageType =
  | "POPUP"
  | "LOG_CHECK"
  | "START_LOG_READING"
  | "STOP_LOG_READING"
  | "LOG_MESSAGE_RECV"
  | "LOG_READ_FINISHED"
  | "READER_READ"
  | "ACTION_LOG"
  | "SET_UUID"
  | "SET_DETAILED_LOGS"
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
  | "UPSERT_DB_SEASON"
  | "INVENTORY_UPDATED"
  | "PLAYER_INVENTORY"
  | "HOVER_IN"
  | "HOVER_OUT"
  | "DRAFT_STATUS"
  | "DRAFT_STATUS_REQUEST"
  | "DRAFT_SAVE"
  | "DRAFT_RATINGS"
  | "DRAFT_VOTES"
  | "DRAFT_END"
  | "UPDATE_ACTIVE_EVENTS"
  | "DAEMON_GET_PLAYER_ID"
  | "CARDS_DB_REQUEST"
  | "CARDS_DB_RESPONSE"
  | "LIVE_SHARE_PUBLISH"
  | "LIVE_SHARE_STOP";

/** One timed memory read, from the background window to whoever is showing it. */
export interface ReaderReadMessage {
  type: "READER_READ";
  value: {
    kind: "memory" | "log";
    name: string;
    ms: number;
    ok: boolean;
    at: number;
    error?: string;
    count?: number;
  };
}

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
  value: ActionLogV2;
}

export interface LogMessageRecvMessage extends ChannelMessageBase {
  type: "LOG_MESSAGE_RECV";
  value: any;
}

export interface LogFinishedMessage extends ChannelMessageBase {
  type: "LOG_READ_FINISHED";
}

export interface SetDetailedLogsMessage extends ChannelMessageBase {
  type: "SET_DETAILED_LOGS";
  value: string;
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

export interface UpsertDbSeasonMessage extends ChannelMessageBase {
  type: "UPSERT_DB_SEASON";
  value: {
    seasonOrdinal: number;
    seasonStartTime: string;
    seasonEndTime: string;
  };
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

/**
 * An overlay window asking the background for the current draft state. The
 * overlay opens BECAUSE of a DRAFT_STATUS broadcast, so by the time it has
 * booted and wired its listener that broadcast is long gone — without this it
 * would sit empty until the next pick.
 */
export interface DraftStatusRequestMessage extends ChannelMessageBase {
  type: "DRAFT_STATUS_REQUEST";
}

/**
 * Persist a draft record without implying a draft is running — DRAFT_STATUS
 * flips draftInProgress (opening overlays), which a post-draft save like the
 * decklist submission must not do.
 */
export interface DraftSaveMessage extends ChannelMessageBase {
  type: "DRAFT_SAVE";
  value: InternalDraftv2;
}

/** 17lands ratings for the set being drafted, for the overlay to rank with. */
export interface DraftRatingsMessage extends ChannelMessageBase {
  type: "DRAFT_RATINGS";
  value: DraftRatings;
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

/** Shape of a card-db query result, mirrored here to avoid an import cycle. */
export interface CardsDbQueryResult {
  columns: string[];
  values: unknown[][];
}

/**
 * A card-db query from a proxy window (overlay / hover / post-match) to the
 * window that owns the SQLite worker. `from` names the requester so the single
 * broadcast reply reaches only it; `rid` is unique within that window.
 */
export interface CardsDbRequestMessage extends ChannelMessageBase {
  type: "CARDS_DB_REQUEST";
  value: {
    from: string;
    rid: number;
    sql: string;
    params: unknown[];
  };
}

/** The answer to a CARDS_DB_REQUEST, addressed back to `to` (the requester). */
export interface CardsDbResponseMessage extends ChannelMessageBase {
  type: "CARDS_DB_RESPONSE";
  value: {
    to: string;
    rid: number;
    ok: boolean;
    result?: CardsDbQueryResult;
    error?: string;
  };
}

/**
 * An overlay window's current share state, sent to the background window which
 * performs the authenticated Supabase upsert (see data/liveShare*.ts).
 */
export interface LiveSharePublishMessage extends ChannelMessageBase {
  type: "LIVE_SHARE_PUBLISH";
  value: {
    shareId: string;
    payload: OverlaySharePayload;
  };
}

/** Ask the background window to remove a shared overlay's row. */
export interface LiveShareStopMessage extends ChannelMessageBase {
  type: "LIVE_SHARE_STOP";
  value: {
    shareId: string;
  };
}

export type ChannelMessage =
  | ReaderReadMessage
  | PopupMessage
  | LogCheckMessage
  | StartLogReadingMessage
  | StopLogReadingMessage
  | ActionLogMessage
  | LogMessageRecvMessage
  | LogFinishedMessage
  | SetDetailedLogsMessage
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
  | UpsertDbSeasonMessage
  | InventoryUpdatedMessage
  | PlayerInventoryMessage
  | HoverInMessage
  | HoverOutMessage
  | OverlaySettingsMessage
  | DraftStatusMessage
  | DraftStatusRequestMessage
  | DraftSaveMessage
  | DraftRatingsMessage
  | DraftVotesMessage
  | DraftEndMessage
  | UpdateActiveEventsMessage
  | DaemonGetPlayerId
  | CardsDbRequestMessage
  | CardsDbResponseMessage
  | LiveSharePublishMessage
  | LiveShareStopMessage;
