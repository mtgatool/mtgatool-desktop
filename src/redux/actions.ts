import * as HoverSlice from "./slices/hoverSlice";
import * as MainDataSlice from "./slices/mainDataSlice";
import * as RendererSlice from "./slices/rendererSlice";
import * as SettingsSlice from "./slices/settingsSlice";

export const actions = {
  SET_HOVER_IN: HoverSlice.setHoverIn,
  SET_HOVER_OUT: HoverSlice.setHoverOut,
  ADD_LIVEFEED: MainDataSlice.addLiveFeed,
  SET_UUID: MainDataSlice.setUUID,
  SET_UUID_DATA: MainDataSlice.setUUIDData,
  SET_CARDS: MainDataSlice.setCards,
  SET_DECKS_INDEX: MainDataSlice.setDecksIndex,
  SET_MATCHES_INDEX: MainDataSlice.setMatchesIndex,
  SET_PEERS: RendererSlice.setPeers,
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
  SET_SCENE: RendererSlice.setScene,
  SET_SETTINGS: SettingsSlice.setSettings,
  SET_OVERLAY_SETTINGS: SettingsSlice.setOverlaySettings,
};

export type ActionKeys = keyof typeof actions;
