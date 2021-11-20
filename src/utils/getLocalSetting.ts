import { SettingKey } from "../types/localSettings";
import backGlobalData from "./backGlobalData";

export default function getLocalSetting(key: SettingKey): string {
  if (typeof jest === "undefined") {
    return window.localStorage.getItem(key) as string;
  }
  return backGlobalData.localSettingsProxy[key];
}
