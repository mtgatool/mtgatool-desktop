/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Format } from "mtgatool-shared";
import {
  LOGIN_WAITING,
  LOGIN_AUTH,
  LOGIN_FAILED,
  LOGIN_OK,
} from "mtgatool-shared/dist/shared/constants";

export const initialRendererState = {
  archivedCache: {} as Record<string, boolean>,
  backgroundGrpid: null as number | null,
  loading: false,
  logCompletion: 0,
  noLog: false,
  offline: false,
  loginState: LOGIN_AUTH,
  patreon: {
    patreon: false,
    patreonTier: -1,
  },
  popup: {
    text: "",
    time: 0,
    duration: 0,
  },
  formats: {} as Record<string, Format>,
  rewards_daily_ends: "",
  rewards_weekly_ends: "",
  topArtist: "Thoughtseize by Aleksi Briclot",
  updateState: "",
  collectionQuery: "",
};

type RendererState = typeof initialRendererState;

const rendererSlice = createSlice({
  name: "renderer",
  initialState: initialRendererState,
  reducers: {
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
    setBackgroundGrpid: (
      state: RendererState,
      action: PayloadAction<number | null>
    ): void => {
      state.backgroundGrpid = action.payload;
      state.topArtist = action.payload ? "" : initialRendererState.topArtist;
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
    setPopup: (
      state: RendererState,
      action: PayloadAction<RendererState["popup"]>
    ): void => {
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
      action: PayloadAction<string>
    ): void => {
      state.collectionQuery = action.payload;
    },
  },
});

export const {
  setLoginState,
  setLogCompletion,
  setBackgroundGrpid,
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
} = rendererSlice.actions;

export default rendererSlice;
