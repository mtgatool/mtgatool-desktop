import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  defaultConfig,
  OverlaySettings,
  Settings,
} from "../../common/defaultConfig";
import getLocalSetting from "../../utils/getLocalSetting";

const savedSettings = JSON.parse(getLocalSetting("settings"));

const initialSettings = {
  ...defaultConfig,
  ...savedSettings,
} as Settings;

const settingsSlice = createSlice({
  name: "settings",
  initialState: initialSettings,
  reducers: {
    setSettings: (
      state: Settings,
      action: PayloadAction<Partial<Settings>>
    ): void => {
      Object.assign(state, action.payload);
    },
    setOverlaySettings: (
      state: Settings,
      action: PayloadAction<{ id: number; settings: Partial<OverlaySettings> }>
    ): void => {
      Object.assign(state.overlays[action.payload.id], action.payload.settings);
    },
  },
});

export const { setSettings, setOverlaySettings } = settingsSlice.actions;

export default settingsSlice;
