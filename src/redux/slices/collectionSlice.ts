/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialCollectionState = {
  countMode: "All cards",
  rareDraftFactor: 3,
  mythicDraftFactor: 0.14,
  boosterWinFactor: 1.2,
  futureBoosters: 0,
};

type Collection = typeof initialCollectionState;

const collectionSlice = createSlice({
  name: "collection",
  initialState: {
    countMode: "All cards",
    rareDraftFactor: 3,
    mythicDraftFactor: 0.14,
    boosterWinFactor: 1.2,
    futureBoosters: 0,
  },
  reducers: {
    setCountMode: (state: Collection, action: PayloadAction<string>): void => {
      state.countMode = action.payload;
    },
    setRareDraftFactor: (
      state: Collection,
      action: PayloadAction<number>
    ): void => {
      state.rareDraftFactor = action.payload;
    },
    setMythicDraftFactor: (
      state: Collection,
      action: PayloadAction<number>
    ): void => {
      state.mythicDraftFactor = action.payload;
    },
    setBoosterWinFactor: (
      state: Collection,
      action: PayloadAction<number>
    ): void => {
      state.boosterWinFactor = action.payload;
    },
    setFutureBoosters: (
      state: Collection,
      action: PayloadAction<number>
    ): void => {
      state.futureBoosters = action.payload;
    },
  },
});

export const {
  setBoosterWinFactor,
  setCountMode,
  setFutureBoosters,
  setMythicDraftFactor,
  setRareDraftFactor,
} = collectionSlice.actions;
export default collectionSlice;
