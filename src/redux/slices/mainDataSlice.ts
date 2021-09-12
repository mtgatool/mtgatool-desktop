/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cards } from "mtgatool-shared";
import {
  DbDeck,
  DbMatch,
  DbUUIDData,
  defaultUUIDData,
} from "../../types/dbTypes";

const mainState = {
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
  currentUUID: "",
  uuidData: {
    "": defaultUUIDData,
  } as Record<string, DbUUIDData>,
  matchesIndex: [] as string[],
  matches: {} as Record<string, DbMatch>,
  decksIndex: {} as Record<string, number>,
  decks: {} as Record<string, DbDeck>,
};

export type PlayerData = typeof mainState;

const mainDataSlice = createSlice({
  name: "mainData",
  initialState: mainState,
  reducers: {
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
    setMatches: (
      state: PlayerData,
      action: PayloadAction<Record<string, DbMatch>>
    ): void => {
      state.matches = {
        ...state.matches,
        ...action.payload,
      };
    },
    setMatch: (state: PlayerData, action: PayloadAction<DbMatch>): void => {
      state.matches = {
        ...state.matches,
        [action.payload.matchId]: action.payload,
      };
    },
    setDecks: (
      state: PlayerData,
      action: PayloadAction<Record<string, DbDeck>>
    ): void => {
      state.decks = { ...state.decks, ...action.payload };
    },
    setDeck: (state: PlayerData, action: PayloadAction<DbDeck>): void => {
      state.decks = {
        ...state.decks,
        [`${action.payload.id}-v${action.payload.version}`]: action.payload,
      };
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
  setUUID,
  setCards,
  setUUIDData,
  setMatches,
  setMatch,
  setDecks,
  setDeck,
  setDecksIndex,
  setMatchesIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
