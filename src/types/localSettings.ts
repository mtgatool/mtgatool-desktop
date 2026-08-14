import { defaultConfig } from "../common/defaultConfig";
import { DEFAULT_PEERS } from "../constants";
import defaultLogUri from "../utils/defaultLogUri";
import isElectron from "../utils/electron/isElectron";
import sha1 from "../utils/sha1";
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
  "saved-peer-keys",
  "css",
  "clientId",
  "showHiddenDecks",
  "filterDate",
  "filterDateOption",
  "filterEventOptions",
  "pubkey",
  "importLogHistory",
  "whatsNewSeen",
  "backgroundShade",
  "postMatchOverview",
  "collectionSetBands",
  "formatsSnapshotHash",
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
  "saved-peer-keys": JSON.stringify(DEFAULT_PEERS),
  css: isElectron() ? "high" : "web",
  clientId: sha1(`${textRandom(100)}-${new Date().getTime()}`),
  showHiddenDecks: "false",
  filterDate: "0",
  filterDateOption: "All Time",
  filterEventOptions: "",
  pubkey: "",
  // Forward-only log reading by default; "true" opts into replaying the full
  // Player.log history on startup.
  importLogHistory: "false",
  // The app version whose "What's new" the user has already dismissed.
  whatsNewSeen: "",
  // The match the post-match overview window should render. Handed over here
  // rather than broadcast, because the window is created in response to the
  // same event that carries the data — it would still be booting when a
  // message went out, and would miss it. localStorage is shared across every
  // window of the app, so the overview reads this the moment it mounts.
  postMatchOverview: "",
  // Which bands of the collection's set picker are open, by name. Only the ones
  // deliberately closed or opened are stored; anything absent falls back to the
  // component's own default, so a new band does not have to be added here too.
  collectionSetBands: "{}",
  // sha256 of the last GetFormats snapshot this client uploaded — the guard
  // that keeps every boot from re-uploading the same formats table.
  formatsSnapshotHash: "",
  // Darkening overlay drawn on top of the app background image, same
  // treatment as the website.
  backgroundShade: "true",
};
