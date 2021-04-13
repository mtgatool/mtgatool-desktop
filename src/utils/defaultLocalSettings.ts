import { settingKeys, defaultSettings } from "../types/localSettings";

export default function defaultLocalSettings() {
  window.cards = {};
  window.economy = {
    gold: 0,
    gems: 0,
    vaultProgress: 0,
    wcTrackPosition: 0,
    wcCommon: 0,
    wcUncommon: 0,
    wcRare: 0,
    wcMythic: 0,
    boosters: [],
  };
  settingKeys.forEach((key) => {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, defaultSettings[key]);
    }
  });
}
