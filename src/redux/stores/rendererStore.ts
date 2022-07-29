import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import collectionSlice from "../slices/collectionSlice";
import mainDataSlice from "../slices/mainDataSlice";
import rendererSlice from "../slices/rendererSlice";
import avatarsSlice from "../slices/avatarsSlice";
import usernamesSlice from "../slices/usernamesSlice";
import settingsSlice from "../slices/settingsSlice";
import hoverSlice from "../slices/hoverSlice";
import filterSlice from "../slices/FilterSlice";

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
