/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as Sentry from "@sentry/react";
import { Format, InternalDraftv2 } from "mtgatool-shared";

import {
  LOGIN_AUTH,
  LOGIN_FAILED,
  LOGIN_OK,
  LOGIN_WAITING,
} from "../../constants";
import getLocalSetting from "../../utils/getLocalSetting";
import setLocalSetting from "../../utils/setLocalSetting";

export interface Peer {
  host: string;
  port: number;
}

export interface Popup {
  text: string;
  time: number;
  color?: string;
  duration: number;
}

export const initialRendererState = {
  pubKey: "",
  archivedCache: {} as Record<string, boolean>,
  backgroundGrpid: null as number | null,
  loading: false,
  logCompletion: 0,
  noLog: false,
  offline: true,
  loginState: LOGIN_AUTH,
  patreon: {
    patreon: false,
    patreonTier: -1,
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
  showPostSignup: null as null | string,
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
    setPubKey: (state: RendererState, action: PayloadAction<string>): void => {
      setLocalSetting("pubkey", action.payload);
      const username = getLocalSetting("username");
      Sentry.setUser({ id: action.payload, username });
      state.pubKey = action.payload;
    },
    setMyUsername: (
      state: RendererState,
      action: PayloadAction<string>
    ): void => {
      setLocalSetting("username", action.payload);
      Sentry.setUser({ id: state.pubKey, username: action.payload });
    },
    setReadingLog: (
      state: RendererState,
      action: PayloadAction<boolean>
    ): void => {
      state.readingLog = action.payload;
    },
    showPostSignup: (
      state: RendererState,
      action: PayloadAction<null | string>
    ): void => {
      state.showPostSignup = action.payload;
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
  setPubKey,
  setMyUsername,
  setReadingLog,
  showPostSignup,
  setLoginState,
  setLogCompletion,
  setMatchesFetchState,
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
  setMatchInProgress,
  setDraftInProgress,
  setCurrentDraft,
  setScene,
} = rendererSlice.actions;

export default rendererSlice;
