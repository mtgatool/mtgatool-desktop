import { SettingKey } from "../types/localSettings";

export default function setLocalSetting(key: SettingKey, value: string) {
  window.localStorage.setItem(key, value);
}
