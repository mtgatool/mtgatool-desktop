import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import avatarsSlice from "../slices/avatarsSlice";
import collectionSlice from "../slices/collectionSlice";
import filterSlice from "../slices/FilterSlice";
import hoverSlice from "../slices/hoverSlice";
import mainDataSlice from "../slices/mainDataSlice";
import rendererSlice from "../slices/rendererSlice";
import settingsSlice from "../slices/settingsSlice";
import usernamesSlice from "../slices/usernamesSlice";

const rootReducer = combineReducers({
  collection: collectionSlice.reducer,
  mainData: mainDataSlice.reducer,
  renderer: rendererSlice.reducer,
  avatars: avatarsSlice.reducer,
  usernames: usernamesSlice.reducer,
  settings: settingsSlice.reducer,
  hover: hoverSlice.reducer,
  filter: filterSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [],
});

(window as any).store = store;

export default store;
export type AppState = ReturnType<typeof rootReducer>;
