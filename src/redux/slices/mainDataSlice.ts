/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cards } from "mtgatool-shared";
import { DbDeck, DbMatch, DbUUIDData } from "../../types/dbTypes";

const mainState = {
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
  currentUUID: "",
  uuidData: {} as Record<string, DbUUIDData>,
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
      action: PayloadAction<Partial<DbUUIDData>>
    ): void => {
      state.uuidData[state.currentUUID] = {
        ...state.uuidData[state.currentUUID],
        ...action.payload,
      };
    },
    setCards: (state: PlayerData, action: PayloadAction<Cards>): void => {
      state.cardsPrev = { ...state.cards };
      state.cards = action.payload;
    },
    setAllUUIDData: (
      state: PlayerData,
      action: PayloadAction<DbUUIDData>
    ): void => {
      state.uuidData = {
        ...state.uuidData,
        [state.currentUUID]: action.payload,
      };
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
        [`${action.payload.deckId}-v${action.payload.version}`]: action.payload,
      };
    },
    setDecksIndex: (
      state: PlayerData,
      action: PayloadAction<Record<string, number>>
    ): void => {
      state.decksIndex = action.payload;
    },
  },
});

export const {
  setUUID,
  setCards,
  setAllUUIDData,
  setUUIDData,
  setMatches,
  setMatch,
  setDecks,
  setDeck,
  setDecksIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
