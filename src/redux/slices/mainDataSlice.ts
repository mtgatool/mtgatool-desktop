/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Cards } from "mtgatool-shared";
import { GunDeck, GunMatch, GunUUIDData } from "../../types/gunTypes";
import baseToObj from "../../utils/baseToObj";

const mainState = {
  cards: {} as Cards,
  cardsNew: {} as Cards,
  cardsPrev: {} as Cards,
  currentUUID: "",
  uuidData: {} as Record<string, GunUUIDData>,
  matches: {} as Record<string, GunMatch>,
  decksIndex: {} as Record<string, number>,
  decks: {} as Record<string, GunDeck>,
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
      action: PayloadAction<Partial<GunUUIDData>>
    ): void => {
      state.uuidData[state.currentUUID] = {
        ...state.uuidData[state.currentUUID],
        ...action.payload,
      };

      if (action.payload.cards) {
        state.cards = baseToObj(action.payload.cards);
      }
      if (action.payload.cardsPrev) {
        state.cardsPrev = baseToObj(action.payload.cardsPrev);
      }
    },
    setMatches: (
      state: PlayerData,
      action: PayloadAction<Record<string, GunMatch>>
    ): void => {
      state.matches = action.payload;
    },
    setMatch: (state: PlayerData, action: PayloadAction<GunMatch>): void => {
      state.matches = {
        ...state.matches,
        [action.payload.matchId]: action.payload,
      };
    },
    setDecks: (
      state: PlayerData,
      action: PayloadAction<Record<string, GunDeck>>
    ): void => {
      state.decks = action.payload;
    },
    setDeck: (state: PlayerData, action: PayloadAction<GunDeck>): void => {
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
  setUUIDData,
  setMatches,
  setMatch,
  setDecks,
  setDeck,
  setDecksIndex,
} = mainDataSlice.actions;

export default mainDataSlice;
