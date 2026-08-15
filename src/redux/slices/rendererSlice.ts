/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  LOGIN_AUTH,
  LOGIN_FAILED,
  LOGIN_OK,
  LOGIN_WAITING,
} from "../../constants";
import { Format, InternalDraftv2 } from "../../types";
import getLocalSetting from "../../utils/getLocalSetting";
import setLocalSetting from "../../utils/setLocalSetting";

export interface Popup {
  text: string;
  time: number;
  color?: string;
  duration: number;
}

export interface CustomBackground {
  /** Image to show: a data: URI (artofmtg) or a local file/blob URL. */
  url: string;
  source: "artofmtg" | "local";
  /** artofmtg metadata (absent for local images). */
  title?: string;
  artist?: string;
  set?: string;
  page?: string;
  /**
   * Original remote image URL (artofmtg only). Not directly loadable (hotlink
   * protected), but it's the compact key we sync to the cloud profile and use
   * to re-materialize `url` on another device / after login.
   */
  imageUrl?: string;
}

export const initialRendererState = {
  archivedCache: {} as Record<string, boolean>,
  backgroundGrpid: null as number | null,
  // Optional custom app background (from the Background settings panel); when
  // set it overrides the default/card-art background.
  customBackground: null as CustomBackground | null,
  // Darkening overlay on top of the background image (Visual settings).
  backgroundShade: getLocalSetting("backgroundShade") !== "false",
  // The name shown for this login. Seeded from the local setting so it is
  // right on the first paint, before the cloud profile has been read.
  displayName: getLocalSetting("displayName") || getLocalSetting("username"),
  loading: false,
  logCompletion: 0,
  detailedLogs: null as boolean | null,
  adminPermissions: null as boolean | null,
  noLog: false,
  offline: true,
  loginState: LOGIN_AUTH,
  patreon: {
    patreon: false,
    // -1 means "not looked up yet", which is not the same as tier 0 ("looked up,
    // not a patron"). Only useSupporter is allowed to collapse the two.
    patreonTier: -1,
    /** ms epoch the pledge lapses; 0 when current. */
    patreonExpires: 0,
    /** ms epoch of the last successful cloud read; 0 when never. */
    patreonChecked: 0,
  },
  popup: null as Popup | null,
  formats: {} as Record<string, Format>,
  rewards_daily_ends: "",
  rewards_weekly_ends: "",
  topArtist: "Thoughtseize by Aleksi Briclot",
  updateState: "",
  collectionQuery: "f:standard r>token",
  matchInProgress: false,
  draftInProgress: false,
  currentDraft: null as InternalDraftv2 | null,
  currentScene: "",
  readingLog: false,
  matchesTotal: 0,
  matchesSaved: 0,
};

type RendererState = typeof initialRendererState;

const rendererSlice = createSlice({
  name: "renderer",
  initialState: initialRendererState,
  reducers: {
    setMyUsername: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      setLocalSetting("username", action.payload);
    },
    setReadingLog: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.readingLog = action.payload;
    },
    setLoginState: (
      state: RendererState,
      action: PayloadAction<
        | typeof LOGIN_WAITING
        | typeof LOGIN_AUTH
        | typeof LOGIN_FAILED
        | typeof LOGIN_OK
      >
    ): void => {
      state.loginState = action.payload;
    },
    setLogCompletion: (
      state: RendererState,
      action: PayloadAction<number>
    ): void => {
      state.logCompletion = action.payload;
    },
    setDetailedLogs: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.detailedLogs = action.payload;
    },
    setAdminPermissions: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.adminPermissions = action.payload;
    },
    setMatchesFetchState: (
      state: RendererState,
      action: PayloadAction<{
        total: number;
        saved: number;
      }>
    ): void => {
      state.matchesTotal = action.payload.total;
      state.matchesSaved = action.payload.saved;
    },
    setBackgroundGrpid: (
      state: RendererState,
      action: PayloadAction<number | null>
    ): void => {
      state.backgroundGrpid = action.payload;
      state.topArtist = action.payload ? "" : initialRendererState.topArtist;
    },
    setCustomBackground: (
      state: RendererState,
      action: PayloadAction<CustomBackground | null>
    ): void => {
      if (!action.payload) {
        state.customBackground = null;
        state.topArtist = initialRendererState.topArtist;
        return;
      }
      const { title, artist } = action.payload;
      state.customBackground = action.payload;
      // Any custom art also clears the card-art background so it can win.
      state.backgroundGrpid = null;
      // Top-bar credit line: "<Title> by <Artist>" when we have both.
      state.topArtist = artist && title ? `${title} by ${artist}` : title || "";
    },
    setBackgroundShade: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.backgroundShade = action.payload;
    },
    setDisplayName: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      state.displayName = action.payload;
    },
    setLoading: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.loading = action.payload;
    },
    setNoLog: (state: RendererState, action: PayloadAction<boolean>): void => {
      state.noLog = action.payload;
    },
    setOffline: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.offline = action.payload;
    },
    setPatreon: (
      state: RendererState,
      action: PayloadAction<RendererState["patreon"]>
    ): void => {
      state.patreon = action.payload;
    },
    setPopup: (state: RendererState, action: PayloadAction<Popup>): void => {
      state.popup = action.payload;
    },
    setFormats: (
      state: RendererState,
      action: PayloadAction<Record<string, Format>>
    ): void => {
      state.formats = action.payload;
    },
    setUpdateState: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      state.updateState = action.payload;
    },
    setArchived: (
      state: RendererState,
      action: PayloadAction<{ id: string; archived: boolean }>
    ): void => {
      const { id, archived } = action.payload;
      if (!id) return;
      // update local cache (avoids round trip)
      state.archivedCache[id] = !!archived;
    },
    setRewardsDailyEnds: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      state.rewards_daily_ends = action.payload;
    },
    setRewardsWeeklyEnds: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      state.rewards_weekly_ends = action.payload;
    },
    setCollectionQuery: (
      state: RendererState,
      action: PayloadAction<{ query: string }>
    ): void => {
      state.collectionQuery = action.payload.query;
    },
    setMatchInProgress: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.matchInProgress = action.payload;
    },
    setDraftInProgress: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.draftInProgress = action.payload;
    },
    setCurrentDraft: (
      state: RendererState,
      action: PayloadAction<InternalDraftv2>
    ): void => {
      state.currentDraft = action.payload;
    },
    setScene: (state: RendererState, action: PayloadAction<string>): void => {
      state.currentScene = action.payload;
    },
  },
});

export const {
  setMyUsername,
  setReadingLog,
  setLoginState,
  setLogCompletion,
  setDetailedLogs,
  setAdminPermissions,
  setMatchesFetchState,
  setBackgroundGrpid,
  setBackgroundShade,
  setCustomBackground,
  setDisplayName,
  setLoading,
  setNoLog,
  setOffline,
  setPatreon,
  setPopup,
  setArchived,
  setFormats,
  setUpdateState,
  setRewardsDailyEnds,
  setRewardsWeeklyEnds,
  setCollectionQuery,
  setMatchInProgress,
  setDraftInProgress,
  setCurrentDraft,
  setScene,
} = rendererSlice.actions;

export default rendererSlice;
