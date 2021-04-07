import { SettingKey } from "../types/localSettings";

export default function getLocalSetting(key: SettingKey): string {
  return window.localStorage.getItem(key) as string;
}
