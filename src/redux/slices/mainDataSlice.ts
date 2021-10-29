/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { Cards } from "mtgatool-shared";

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
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
  forceCollection: 1,
  currentUUID: "",
  uuidData: {} as Record<
    string,
    {
      rank: DbRankData;
      inventory: DbInventoryData;
      cards: DbCardsData;
    }
  >,
  liveFeed: [] as DbMatch[],
  matchesIndex: [] as string[],
  decksIndex: {} as Record<string, number>,
  fullStats: null as AggregatedStats | null,
  historyStats: null as AggregatedStats | null,
};

export type MainState = typeof mainState;

function makeDefaultUUIDData(): MainState["uuidData"][""] {
  return {
    rank: { ...defaultRankData, updated: 0 },
    inventory: { ...defaultInventoryData, updated: 0 },
    cards: defaultCardsData,
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
    addLiveFeed: (state: MainState, action: PayloadAction<DbMatch>): void => {
      const matches = state.liveFeed.filter(
        (v) => v.matchId === action.payload.matchId
      );
      state.liveFeed =
        matches.length === 0
          ? [action.payload, ...state.liveFeed].slice(0, 10)
          : state.liveFeed;
    },
    setUUID: (state: MainState, action: PayloadAction<string>): void => {
      state.currentUUID = action.payload;
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
    setCards: (state: MainState, action: PayloadAction<Cards>): void => {
      state.cardsPrev = { ...state.cards };
      state.cards = action.payload;
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
  },
});

export const {
  setFullStats,
  setHistoryStats,
  addLiveFeed,
  setUUID,
  setCards,
  setForceCollection,
  setUUIDRank,
  setUUIDInventory,
  setUUIDCards,
  setDecksIndex,
  setMatchesIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
