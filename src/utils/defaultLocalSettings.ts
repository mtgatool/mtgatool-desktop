import { settingKeys, defaultSettings } from "../types/localSettings";

export default function defaultLocalSettings() {
  settingKeys.forEach((key) => {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, defaultSettings[key]);
    }
  });
}
