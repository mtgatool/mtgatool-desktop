import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import playerDataSlice from "../slices/playerDataSlice";
import rendererSlice from "../slices/rendererSlice";
import hoverSlice from "../slices/hoverSlice";

const rootReducer = combineReducers({
  playerdata: playerDataSlice.reducer,
  renderer: rendererSlice.reducer,
  hover: hoverSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [],
});

export default store;
export type AppState = ReturnType<typeof rootReducer>;
