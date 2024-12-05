export interface OverlaySettingsData {
  alpha: number;
  alphaBack: number;
  autosize: boolean;
  bounds: { width: number; height: number; x: number; y: number };
  clock: boolean;
  drawOdds: boolean;
  deck: boolean;
  lands: boolean;
  manaCurve: boolean;
  mode: number;
  enabled: boolean;
  showAlways: boolean;
  sideboard: boolean;
  title: boolean;
  typeCounts: boolean;
  collapsed: boolean;
}

export type CardQuality = "small" | "normal" | "large";

export interface SettingsData {
  themeUri: string;
  cardsQuality: CardQuality;
  cardsSize: number;
  cardsSizeHoverCard: number;
  closeOnMatch: boolean;
  closeToTray: boolean;
  collectionQuery: string;
  collectionMode: string;
  enableKeyboardShortcuts: boolean;
  eventsTableMode: string;
  exportFormat: string;
  lastDateFilter: string;
  lastOpenTab: number;
  settingsOverlaySection: number;
  settingsSection: number;
  overlayOverview: boolean;
  overlayHover: { x: number; y: number };
  overlays: OverlaySettingsData[];
  rightPanelWidth: number;
  skipFirstpass: boolean;
  shortcutEditmode: string;
  shortcutDevtoolsMain: string;
  shortcutDevtoolsOverlay: string;
  sendData: boolean;
}
