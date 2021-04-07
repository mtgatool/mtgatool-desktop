import * as PlayerDataSlice from "./slices/playerDataSlice";
import * as HoverSlice from "./slices/hoverSlice";
import * as RendererSlice from "./slices/rendererSlice";

export const actions = {
  SET_HOVER_IN: HoverSlice.setHoverIn,
  SET_HOVER_OUT: HoverSlice.setHoverOut,
  SET_PLAYER_ID: PlayerDataSlice.setPlayerId,
  SET_PLAYER_NAME: PlayerDataSlice.setPlayerName,
  SET_ARENA_VERSION: PlayerDataSlice.setArenaVersion,
  SET_PLAYER_ECONOMY: PlayerDataSlice.setEconomy,
  SET_TAG_COLORS: PlayerDataSlice.setTagColors,
  EDIT_TAG_COLOR: PlayerDataSlice.editTagColor,
  SET_RANK: PlayerDataSlice.setRank,
  ADD_CARD: PlayerDataSlice.addCard,
  ADD_CARDS_LIST: PlayerDataSlice.addCardsList,
  ADD_CARDS_KEYS: PlayerDataSlice.addCardsKeys,
  ADD_CARDS_FROM_STORE: PlayerDataSlice.addCardsFromStore,
  SET_CARDS_TIME: PlayerDataSlice.setCardsTime,
  REMOVE_DECK_TAG: PlayerDataSlice.removeDeckTag,
  ADD_DECK_TAG: PlayerDataSlice.addDeckTag,
  SET_DECK_TAGS: PlayerDataSlice.setDeckTags,
  SET_LOGIN_STATE: RendererSlice.setLoginState,
  SET_LOG_COMPLETION: RendererSlice.setLogCompletion,
  SET_ARCHIVED: RendererSlice.setArchived,
  SET_BACK_IMAGE: RendererSlice.setBackgroundImage,
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
