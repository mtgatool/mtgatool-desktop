import { sha1 } from "mtgatool-shared";
import { defaultConfig } from "../common/defaultConfig";
import { DEFAULT_PEERS } from "../constants";
import defaultLogUri from "../utils/defaultLogUri";
import isElectron from "../utils/electron/isElectron";
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
  "peers",
  "css",
  "clientId",
  "showHiddenDecks",
  "daemonPort",
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
  peers: JSON.stringify(DEFAULT_PEERS),
  css: isElectron() ? "high" : "web",
  clientId: sha1(`${textRandom(100)}-${new Date().getTime()}`),
  showHiddenDecks: "false",
  daemonPort: "6842",
};
