import { defaultConfig } from "../common/defaultConfig";
import defaultLogUri from "../utils/defaultLogUri";
import isElectron from "../utils/electron/isElectron";

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
  "peers",
  "css",
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
  peers: JSON.stringify(["127.0.0.1"]),
  css: isElectron() ? "high" : "web",
};
