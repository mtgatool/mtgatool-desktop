import { defaultSettings, SettingKey } from "../types/localSettings";
import backGlobalData from "./backGlobalData";

export default function getLocalSetting(key: SettingKey): string {
  if (typeof jest === "undefined") {
    const val = window.localStorage.getItem(key) as string;

    return val || defaultSettings[key];
  }
  return backGlobalData.localSettingsProxy[key];
}
