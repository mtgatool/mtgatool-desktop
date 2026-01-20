import { Peer } from "tool-db";

// Electron window titles (for backwards compatibility)
export const WINDOW_BACKGROUND = "mtgatool-background";

export const WINDOW_HOVER = "mtgatool-hover";

export const WINDOW_MAIN = "MTG Arena Tool";

export const WINDOW_UPDATER = "mtgatool-updater";

export const WINDOW_OVERLAY_0 = "mtgatool-overlay-0";

export const WINDOW_OVERLAY_1 = "mtgatool-overlay-1";

export const WINDOW_OVERLAY_2 = "mtgatool-overlay-2";

export const WINDOW_OVERLAY_3 = "mtgatool-overlay-3";

export const WINDOW_OVERLAY_4 = "mtgatool-overlay-4";

export const ALL_OVERLAYS = [
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
];

// Tauri window labels
export const TAURI_LABEL_MAIN = "main";
export const TAURI_LABEL_BACKGROUND = "background";
export const TAURI_LABEL_HOVER = "hover";
export const TAURI_LABEL_OVERLAY_PREFIX = "overlay-";

export const ALL_TAURI_OVERLAY_LABELS = [
  `${TAURI_LABEL_OVERLAY_PREFIX}0`,
  `${TAURI_LABEL_OVERLAY_PREFIX}1`,
  `${TAURI_LABEL_OVERLAY_PREFIX}2`,
  `${TAURI_LABEL_OVERLAY_PREFIX}3`,
  `${TAURI_LABEL_OVERLAY_PREFIX}4`,
];

// Helper to convert Tauri label to overlay index
export function getOverlayIndexFromLabel(label: string): number {
  if (label.startsWith(TAURI_LABEL_OVERLAY_PREFIX)) {
    return parseInt(label.replace(TAURI_LABEL_OVERLAY_PREFIX, ""), 10);
  }
  // Electron format
  const match = label.match(/mtgatool-overlay-(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return -1;
}

// In the new P2P architecture, ServerPeerData is no longer used
// Connection data is simplified
export interface ConnectionData {
  peerId: string;
  peerData: Peer | null;
  serverPeerData: null;
  host: string;
  isConnected: boolean;
}
