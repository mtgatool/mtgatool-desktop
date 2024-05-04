import { CardQuality, constants } from "mtgatool-shared";

import electron from "../utils/electron/electronWrapper";
import remote from "../utils/electron/remoteWrapper";

const {
  COLLECTION_CARD_MODE,
  MATCHES_LIST_MODE,
  OVERLAY_SEEN,
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_MIXED,
} = constants;

let primaryX = 0;
let primaryY = 0;
if (remote) {
  primaryX = remote.screen.getPrimaryDisplay().bounds.x;
  primaryY = remote.screen.getPrimaryDisplay().bounds.y;
}

const overlayCfg = {
  alpha: 1,
  alphaBack: 0.7,
  bounds: { width: 300, height: 600, x: primaryX, y: primaryY },
  clock: false,
  drawOdds: true,
  deck: true,
  lands: true,
  keyboardShortcut: true,
  manaCurve: false,
  mode: 1,
  ontop: true,
  show: true,
  showAlways: false,
  sideboard: false,
  title: true,
  top: true,
  typeCounts: false,
  autosize: false,
  collapsed: false,
};

export type OverlaySettings = typeof overlayCfg;

export const defaultConfig = {
  overlayBackColor: "#000000ff",
  overlayOverview: true,
  overlayHover: true,
  overlaysTransparency: !!(electron && process.platform !== "linux"),
  overlayResizable: false,
  overlaySkipTaskbar: false,
  overlayFrame: false,
  overlayAcceptFirstMouse: true,
  settingsSection: 1,
  settingsOverlaySection: 0,
  cardsQuality: "normal" as CardQuality,
  startup: true,
  closeToTray: true,
  closeOnMatch: true,
  cardsSize: 2,
  cardsSizeHoverCard: 10,
  exportFormat: "$Name,$Count,$Rarity,$SetName,$Collector",
  collectionMode: COLLECTION_CARD_MODE,
  matchesTableState: undefined,
  matchesTableMode: MATCHES_LIST_MODE,
  skipFirstpass: false,
  privateMode: false,
  enableKeyboardShortcuts: true,
  shortcutOverlay1: "Alt+Shift+1",
  shortcutOverlay2: "Alt+Shift+2",
  shortcutOverlay3: "Alt+Shift+3",
  shortcutOverlay4: "Alt+Shift+4",
  shortcutOverlay5: "Alt+Shift+5",
  shortcutEditmode: "Alt+Shift+E",
  shortcutDevtoolsMain: "Alt+Shift+D",
  shortcutDevtoolsOverlay: "Alt+Shift+O",
  hoverPosition: 7,
  overlays: [
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 280,
        height: 600,
        y: 64,
      },
      mode: OVERLAY_MIXED,
      autosize: true,
      clock: false,
      alpha: 1,
      alphaBack: 0.4,
      lands: true,
    },
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 280,
        height: 600,
        x: 300,
        y: 64,
      },
      mode: OVERLAY_SEEN,
      autosize: true,
      clock: false,
      alpha: 1,
      alphaBack: 0.4,
    },
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 300,
        height: 600,
        y: 64,
      },
      mode: OVERLAY_DRAFT,
      clock: false,
      show: false,
    },
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 300,
        height: 600,
        y: 64,
      },
      mode: OVERLAY_LOG,
      clock: false,
      show: false,
    },
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 300,
        height: 600,
        y: 64,
      },
      mode: OVERLAY_FULL,
      autosize: true,
      show: false,
    },
  ] as OverlaySettings[],
};

export type Settings = typeof defaultConfig;
