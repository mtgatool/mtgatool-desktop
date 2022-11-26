import { defaultSettings, settingKeys } from "../types/localSettings";

export default function defaultLocalSettings() {
  settingKeys.forEach((key) => {
    const value = window.localStorage.getItem(key);
    if (value === null || value === undefined || value === "undefined") {
      window.localStorage.setItem(key, defaultSettings[key]);
    }
  });
}
