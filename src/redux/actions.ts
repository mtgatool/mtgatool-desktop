import * as HoverSlice from "./slices/hoverSlice";
import * as CollectionSlice from "./slices/collectionSlice";
import * as MainDataSlice from "./slices/mainDataSlice";
import * as RendererSlice from "./slices/rendererSlice";
import * as avatarsSlice from "./slices/avatarsSlice";
import * as SettingsSlice from "./slices/settingsSlice";

export const actions = {
  SET_HOVER_IN: HoverSlice.setHoverIn,
  SET_HOVER_OUT: HoverSlice.setHoverOut,
  SET_BOOSTER_WIN_FACTOR: CollectionSlice.setBoosterWinFactor,
  SET_COUNT_MODE: CollectionSlice.setCountMode,
  SET_FUTURE_BOOSTERS: CollectionSlice.setFutureBoosters,
  SET_MYTHIC_DRAFT_FACTOR: CollectionSlice.setMythicDraftFactor,
  SET_RARE_DRAFT_FACTOR: CollectionSlice.setRareDraftFactor,
  SET_FULL_STATS: MainDataSlice.setFullStats,
  SET_HISTORY_STATS: MainDataSlice.setHistoryStats,
  SET_LIVE_FEED: MainDataSlice.setLiveFeed,
  SET_LIVE_FEED_MATCH: MainDataSlice.setLiveFeedMatch,
  SET_UUID: MainDataSlice.setUUID,
  SET_UUID_RANK_DATA: MainDataSlice.setUUIDRank,
  SET_UUID_INVENTORY_DATA: MainDataSlice.setUUIDInventory,
  SET_UUID_CARDS_DATA: MainDataSlice.setUUIDCards,
  FORCE_COLLECTION: MainDataSlice.setForceCollection,
  SET_DECKS_INDEX: MainDataSlice.setDecksIndex,
  SET_MATCHES_INDEX: MainDataSlice.setMatchesIndex,
  SET_HIDDEN_DECKS: MainDataSlice.setHiddenDecks,
  SET_PEERS: RendererSlice.setPeers,
  SET_READING_LOG: RendererSlice.setReadingLog,
  SHOW_POST_SIGNUP: RendererSlice.showPostSignup,
  SET_LOGIN_STATE: RendererSlice.setLoginState,
  SET_LOG_COMPLETION: RendererSlice.setLogCompletion,
  SET_ARCHIVED: RendererSlice.setArchived,
  SET_BACK_GRPID: RendererSlice.setBackgroundGrpid,
  SET_LOADING: RendererSlice.setLoading,
  SET_NO_LOG: RendererSlice.setNoLog,
  SET_OFFLINE: RendererSlice.setOffline,
  SET_PATREON: RendererSlice.setPatreon,
  SET_POPUP: RendererSlice.setPopup,
  SET_FORMATS: RendererSlice.setFormats,
  SET_UPDATE_STATE: RendererSlice.setUpdateState,
  SET_DAILY_ENDS: RendererSlice.setRewardsDailyEnds,
  SET_WEEKLY_ENDS: RendererSlice.setRewardsWeeklyEnds,
  SET_COLLECTION_QUERY: RendererSlice.setCollectionQuery,
  SET_MATCH_IN_PROGRESS: RendererSlice.setMatchInProgress,
  SET_DRAFT_IN_PROGRESS: RendererSlice.setDraftInProgress,
  SET_CURRENT_DRAFT: RendererSlice.setCurrentDraft,
  SET_SCENE: RendererSlice.setScene,
  SET_AVATAR: avatarsSlice.setAvatar,
  SET_SETTINGS: SettingsSlice.setSettings,
  SET_OVERLAY_SETTINGS: SettingsSlice.setOverlaySettings,
};

export type ActionKeys = keyof typeof actions;
