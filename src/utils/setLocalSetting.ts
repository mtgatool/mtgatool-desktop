import { SettingKey } from "../types/localSettings";
import backGlobalData from "./backGlobalData";

export default function setLocalSetting(key: SettingKey, value: string) {
  if (typeof jest === "undefined") {
    window.localStorage.setItem(key, value);
  } else {
    backGlobalData.localSettingsProxy[key] = value;
  }
}
