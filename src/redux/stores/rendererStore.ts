import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import mainDataSlice from "../slices/mainDataSlice";
import rendererSlice from "../slices/rendererSlice";
import avatarsSlice from "../slices/avatarsSlice";
import settingsSlice from "../slices/settingsSlice";
import hoverSlice from "../slices/hoverSlice";

const rootReducer = combineReducers({
  mainData: mainDataSlice.reducer,
  renderer: rendererSlice.reducer,
  avatars: avatarsSlice.reducer,
  settings: settingsSlice.reducer,
  hover: hoverSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [],
});

(window as any).store = store;

export default store;
export type AppState = ReturnType<typeof rootReducer>;
