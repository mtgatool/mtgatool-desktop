import { defaultConfig } from "../common/defaultConfig";
import defaultLogUri from "../utils/defaultLogUri";
import sha1 from "../utils/sha1";
import isTauri from "../utils/tauri/isTauri";
import textRandom from "../utils/textRandom";

export const settingKeys = [
  "autoLogin",
  "logPath",
  "betaChannel",
  "rememberme",
  "username",
  "savedPass",
  "playerId",
  "settings",
  "welcome",
  "lang",
  "css",
  "clientId",
  "showHiddenDecks",
  "filterDate",
  "filterDateOption",
  "filterEventOptions",
  "pubkey",
] as const;

export type SettingKey = typeof settingKeys[number];

export const defaultSettings: Record<SettingKey, string> = {
  autoLogin: "false",
  logPath: defaultLogUri(),
  betaChannel: "false",
  rememberme: "true",
  username: "",
  savedPass: "",
  playerId: "",
  settings: JSON.stringify(defaultConfig),
  welcome: "false",
  lang: "en",
  css: isTauri() ? "high" : "web",
  clientId: sha1(`${textRandom(100)}-${new Date().getTime()}`),
  showHiddenDecks: "false",
  filterDate: "0",
  filterDateOption: "All Time",
  filterEventOptions: "",
  pubkey: "",
};
