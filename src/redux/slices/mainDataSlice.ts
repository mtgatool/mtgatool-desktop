/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { Cards } from "mtgatool-shared";

import { DbMatch, DbUUIDData, defaultUUIDData } from "../../types/dbTypes";

const mainState = {
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
  forceCollection: 1,
  currentUUID: "",
  uuidData: {
    "": defaultUUIDData,
  } as Record<string, DbUUIDData>,
  liveFeed: [] as DbMatch[],
  matchesIndex: [] as string[],
  decksIndex: {} as Record<string, number>,
};

export type PlayerData = typeof mainState;

const mainDataSlice = createSlice({
  name: "mainData",
  initialState: mainState,
  reducers: {
    addLiveFeed: (state: PlayerData, action: PayloadAction<DbMatch>): void => {
      const matches = state.liveFeed.filter(
        (v) => v.matchId === action.payload.matchId
      );
      state.liveFeed =
        matches.length === 0
          ? [action.payload, ...state.liveFeed].slice(0, 10)
          : state.liveFeed;
    },
    setUUID: (state: PlayerData, action: PayloadAction<string>): void => {
      state.currentUUID = action.payload;
    },
    setUUIDData: (
      state: PlayerData,
      action: PayloadAction<{ data: DbUUIDData; uuid: string }>
    ): void => {
      state.uuidData = {
        ...state.uuidData,
        [action.payload.uuid]: {
          ...(state.uuidData[action.payload.uuid] || {}),
          ...action.payload.data,
        },
      };
    },
    setCards: (state: PlayerData, action: PayloadAction<Cards>): void => {
      state.cardsPrev = { ...state.cards };
      state.cards = action.payload;
    },
    setForceCollection: (
      state: PlayerData,
      _action: PayloadAction<undefined>
    ): void => {
      state.forceCollection = new Date().getTime();
    },
    setDecksIndex: (
      state: PlayerData,
      action: PayloadAction<Record<string, number>>
    ): void => {
      state.decksIndex = { ...state.decksIndex, ...action.payload };
    },
    setMatchesIndex: (
      state: PlayerData,
      action: PayloadAction<string[]>
    ): void => {
      state.matchesIndex = _.uniq([...state.matchesIndex, ...action.payload]);
    },
  },
});

export const {
  addLiveFeed,
  setUUID,
  setCards,
  setForceCollection,
  setUUIDData,
  setDecksIndex,
  setMatchesIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
