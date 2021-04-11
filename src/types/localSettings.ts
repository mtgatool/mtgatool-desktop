import { OverlaySettingsData } from "mtgatool-shared";
import {
  OVERLAY_DRAFT,
  OVERLAY_LOG,
  OVERLAY_MIXED,
  OVERLAY_SEEN,
} from "mtgatool-shared/dist/shared/constants";
import defaultLogUri from "../utils/defaultLogUri";

export const settingKeys = [
  "autoLogin",
  "logPath",
  "betaChannel",
  "rememberme",
  "username",
  "savedPassword",
  "playerId",
  "overlay_0",
  "overlay_1",
  "overlay_2",
  "overlay_3",
  "overlay_4",
] as const;

export type SettingKey = typeof settingKeys[number];

const defaultOverlaySettings: OverlaySettingsData = {
  alpha: 1,
  alphaBack: 1,
  autosize: true,
  bounds: {
    width: 270,
    height: 500,
    x: 8,
    y: 8,
  },
  clock: false,
  drawOdds: false,
  deck: true,
  lands: true,
  manaCurve: false,
  mode: OVERLAY_MIXED,
  enabled: true,
  showAlways: true,
  sideboard: false,
  title: true,
  typeCounts: true,
  collapsed: true,
};

export const defaultSettings: Record<SettingKey, string> = {
  autoLogin: "false",
  logPath: defaultLogUri(),
  betaChannel: "false",
  rememberme: "true",
  username: "",
  savedPassword: "",
  playerId: "",
  overlay_0: JSON.stringify({
    ...defaultOverlaySettings,
    bounds: {
      width: 270,
      height: 500,
      x: 8,
      y: 8,
    },
  }),
  overlay_1: JSON.stringify({
    ...defaultOverlaySettings,
    bounds: {
      width: 270,
      height: 500,
      x: 286,
      y: 8,
    },
    mode: OVERLAY_SEEN,
  }),
  overlay_2: JSON.stringify({
    ...defaultOverlaySettings,
    bounds: {
      width: 270,
      height: 500,
      x: 8,
      y: 8,
    },
    mode: OVERLAY_DRAFT,
    enabled: false,
  }),
  overlay_3: JSON.stringify({
    ...defaultOverlaySettings,
    bounds: {
      width: 270,
      height: 500,
      x: 8,
      y: 8,
    },
    mode: OVERLAY_LOG,
    enabled: false,
  }),
  overlay_4: JSON.stringify({
    ...defaultOverlaySettings,
    bounds: {
      width: 270,
      height: 500,
      x: 8,
      y: 8,
    },
    enabled: false,
  }),
};
