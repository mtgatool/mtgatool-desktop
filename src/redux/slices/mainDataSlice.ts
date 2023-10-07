/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";

import {
  DbCardsData,
  DbInventoryData,
  DbMatch,
  DbRankData,
  defaultCardsData,
  defaultInventoryData,
  defaultRankData,
} from "../../types/dbTypes";
import { AggregatedStats } from "../../utils/aggregateStats";

const mainState = {
  forceCollection: 1,
  currentUUID: "",
  uuidData: {} as Record<
    string,
    {
      rank: DbRankData;
      inventory: DbInventoryData;
      cards: DbCardsData;
      displayName: string | null;
    }
  >,
  liveFeed: [] as string[],
  liveFeedMatches: {} as Record<string, DbMatch>,
  matchesIndex: [] as string[],
  draftsIndex: [] as string[],
  hiddenDecks: [] as string[],
  decksIndex: {} as Record<string, number>,
  fullStats: null as AggregatedStats | null,
  historyStats: null as AggregatedStats | null,
};

export type MainState = typeof mainState;

export function makeDefaultUUIDData(): MainState["uuidData"][""] {
  return {
    rank: { ...defaultRankData, updated: 0 },
    inventory: { ...defaultInventoryData, updated: 0 },
    cards: defaultCardsData,
    displayName: null,
  };
}

const mainDataSlice = createSlice({
  name: "mainData",
  initialState: mainState,
  reducers: {
    setFullStats: (
      state: MainState,
      action: PayloadAction<AggregatedStats>
    ): void => {
      state.fullStats = { ...action.payload };
    },
    setHistoryStats: (
      state: MainState,
      action: PayloadAction<AggregatedStats>
    ): void => {
      state.historyStats = { ...action.payload };
    },
    setLiveFeed: (state: MainState, action: PayloadAction<string[]>): void => {
      state.liveFeed = action.payload;
    },
    setLiveFeedMatch: (
      state: MainState,
      action: PayloadAction<{ key: string; match: DbMatch }>
    ): void => {
      state.liveFeedMatches[action.payload.key] = action.payload.match;
    },
    setUUID: (state: MainState, action: PayloadAction<string>): void => {
      state.currentUUID = action.payload;
    },
    removeUUID: (state: MainState, action: PayloadAction<string>): void => {
      state.uuidData = _.omit(state.uuidData, action.payload);
    },
    setUUIDDisplayName: (
      state: MainState,
      action: PayloadAction<{ displayName: string | null; uuid: string }>
    ): void => {
      if (!state.uuidData[action.payload.uuid]) {
        state.uuidData[action.payload.uuid] = {
          ...makeDefaultUUIDData(),
          displayName: action.payload.displayName,
        };
      } else {
        state.uuidData[action.payload.uuid].displayName =
          action.payload.displayName;
      }
    },
    setUUIDRank: (
      state: MainState,
      action: PayloadAction<{ rank: DbRankData; uuid: string }>
    ): void => {
      if (!state.uuidData[action.payload.uuid]) {
        state.uuidData[action.payload.uuid] = {
          ...makeDefaultUUIDData(),
          rank: action.payload.rank,
        };
      } else {
        state.uuidData[action.payload.uuid].rank = action.payload.rank;
      }
    },
    setUUIDInventory: (
      state: MainState,
      action: PayloadAction<{ inventory: DbInventoryData; uuid: string }>
    ): void => {
      if (!state.uuidData[action.payload.uuid]) {
        state.uuidData[action.payload.uuid] = {
          ...makeDefaultUUIDData(),
          inventory: action.payload.inventory,
        };
      } else {
        state.uuidData[action.payload.uuid].inventory =
          action.payload.inventory;
      }
    },
    setUUIDCards: (
      state: MainState,
      action: PayloadAction<{ cards: DbCardsData; uuid: string }>
    ): void => {
      if (!state.uuidData[action.payload.uuid]) {
        state.uuidData[action.payload.uuid] = {
          ...makeDefaultUUIDData(),
          cards: action.payload.cards,
        };
      } else {
        state.uuidData[action.payload.uuid].cards = action.payload.cards;
      }
    },
    setForceCollection: (
      state: MainState,
      _action: PayloadAction<undefined>
    ): void => {
      state.forceCollection = new Date().getTime();
    },
    setDecksIndex: (
      state: MainState,
      action: PayloadAction<Record<string, number>>
    ): void => {
      state.decksIndex = { ...state.decksIndex, ...action.payload };
    },
    setMatchesIndex: (
      state: MainState,
      action: PayloadAction<string[]>
    ): void => {
      state.matchesIndex = _.uniq([...state.matchesIndex, ...action.payload]);
    },
    setDraftsIndex: (
      state: MainState,
      action: PayloadAction<string[]>
    ): void => {
      state.draftsIndex = _.uniq([...state.draftsIndex, ...action.payload]);
    },
    setHiddenDecks: (
      state: MainState,
      action: PayloadAction<string[]>
    ): void => {
      state.hiddenDecks = action.payload;
    },
  },
});

export const {
  setFullStats,
  setHistoryStats,
  setLiveFeed,
  setLiveFeedMatch,
  setUUID,
  removeUUID,
  setForceCollection,
  setUUIDDisplayName,
  setUUIDRank,
  setUUIDInventory,
  setUUIDCards,
  setDecksIndex,
  setMatchesIndex,
  setDraftsIndex,
  setHiddenDecks,
} = mainDataSlice.actions;

export default mainDataSlice;
