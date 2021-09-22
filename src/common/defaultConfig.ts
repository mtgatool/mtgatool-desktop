import { constants, CardQuality } from "mtgatool-shared";
import electron from "../utils/electron/electronWrapper";

const {
  COLLECTION_CARD_MODE,
  MATCHES_LIST_MODE,
  OVERLAY_SEEN,
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_MIXED,
} = constants;

const overlayCfg = {
  alpha: 1,
  alphaBack: 0.7,
  bounds: { width: 300, height: 600, x: 0, y: 0 },
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
  settingsSection: 1,
  settingsOverlaySection: 0,
  cardsQuality: "normal" as CardQuality,
  startup: true,
  closeToTray: true,
  closeOnMatch: true,
  cardsSize: 2,
  cardsSizeHoverCard: 10,
  exportFormat: "$Name,$Count,$Rarity,$SetName,$Collector",
  collectionQuery: "f:standard r>token",
  collectionMode: COLLECTION_CARD_MODE,
  matchesTableState: undefined,
  matchesTableMode: MATCHES_LIST_MODE,
  skipFirstpass: false,
  enableKeyboardShortcuts: true,
  shortcutOverlay1: "Alt+Shift+1",
  shortcutOverlay2: "Alt+Shift+2",
  shortcutOverlay3: "Alt+Shift+3",
  shortcutOverlay4: "Alt+Shift+4",
  shortcutOverlay5: "Alt+Shift+5",
  shortcutEditmode: "Alt+Shift+E",
  shortcutDevtoolsMain: "Alt+Shift+D",
  shortcutDevtoolsOverlay: "Alt+Shift+O",
  overlays: [
    {
      ...overlayCfg,
      bounds: {
        ...overlayCfg.bounds,
        width: 280,
        height: 600,
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
      },
      mode: OVERLAY_FULL,
      autosize: true,
      show: false,
    },
  ] as OverlaySettings[],
};

export type Settings = typeof defaultConfig;
