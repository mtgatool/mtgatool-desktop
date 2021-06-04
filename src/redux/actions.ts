import * as HoverSlice from "./slices/hoverSlice";
import * as MainDataSlice from "./slices/mainDataSlice";
import * as RendererSlice from "./slices/rendererSlice";

export const actions = {
  SET_HOVER_IN: HoverSlice.setHoverIn,
  SET_HOVER_OUT: HoverSlice.setHoverOut,
  SET_UUID: MainDataSlice.setUUID,
  SET_UUID_DATA: MainDataSlice.setUUIDData,
  SET_ALL_UUID_DATA: MainDataSlice.setAllUUIDData,
  SET_MATCHES: MainDataSlice.setMatches,
  SET_MATCH: MainDataSlice.setMatch,
  SET_DECKS: MainDataSlice.setDecks,
  SET_DECK: MainDataSlice.setDeck,
  SET_DECKS_INDEX: MainDataSlice.setDecksIndex,
  SET_LOGIN_STATE: RendererSlice.setLoginState,
  SET_LOG_COMPLETION: RendererSlice.setLogCompletion,
  SET_ARCHIVED: RendererSlice.setArchived,
  SET_BACK_GRPID: RendererSlice.setBackgroundGrpid,
  SET_LOADING: RendererSlice.setLoading,
  SET_NO_LOG: RendererSlice.setNoLog,
  SET_OFFLINE: RendererSlice.setOffline,
  SET_PATREON: RendererSlice.setPatreon,
  SET_POPUP: RendererSlice.setPopup,
  SET_TOPARTIST: RendererSlice.setTopArtist,
  SET_FORMATS: RendererSlice.setFormats,
  SET_UPDATE_STATE: RendererSlice.setUpdateState,
  SET_DAILY_ENDS: RendererSlice.setRewardsDailyEnds,
  SET_WEEKLY_ENDS: RendererSlice.setRewardsWeeklyEnds,
};

export type ActionKeys = keyof typeof actions;
