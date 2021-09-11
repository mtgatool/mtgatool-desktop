import { defaultConfig } from "../common/defaultConfig";
import defaultLogUri from "../utils/defaultLogUri";

export const settingKeys = [
  "autoLogin",
  "logPath",
  "betaChannel",
  "rememberme",
  "username",
  "savedPassword",
  "playerId",
  "settings",
  "welcome",
] as const;

export type SettingKey = typeof settingKeys[number];

export const defaultSettings: Record<SettingKey, string> = {
  autoLogin: "false",
  logPath: defaultLogUri(),
  betaChannel: "false",
  rememberme: "true",
  username: "",
  savedPassword: "",
  playerId: "",
  settings: JSON.stringify(defaultConfig),
  welcome: "false",
};
