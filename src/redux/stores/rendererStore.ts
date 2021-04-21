import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import mainDataSlice from "../slices/mainDataSlice";
import rendererSlice from "../slices/rendererSlice";
import hoverSlice from "../slices/hoverSlice";

const rootReducer = combineReducers({
  mainData: mainDataSlice.reducer,
  renderer: rendererSlice.reducer,
  hover: hoverSlice.reducer,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: [],
});

export default store;
export type AppState = ReturnType<typeof rootReducer>;
