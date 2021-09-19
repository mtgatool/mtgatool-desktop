/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cards } from "mtgatool-shared";

import { DbMatch, DbUUIDData, defaultUUIDData } from "../../types/dbTypes";

const mainState = {
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
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
      state.liveFeed = [action.payload, ...state.liveFeed].slice(0, 10);
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
    setDecksIndex: (
      state: PlayerData,
      action: PayloadAction<Record<string, number>>
    ): void => {
      state.decksIndex = action.payload;
    },
    setMatchesIndex: (
      state: PlayerData,
      action: PayloadAction<string[]>
    ): void => {
      state.matchesIndex = action.payload;
    },
  },
});

export const {
  addLiveFeed,
  setUUID,
  setCards,
  setUUIDData,
  setDecksIndex,
  setMatchesIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
