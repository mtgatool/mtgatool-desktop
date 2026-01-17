import { Peer } from "tool-db";

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

// In the new P2P architecture, ServerPeerData is no longer used
// Connection data is simplified
export interface ConnectionData {
  peerId: string;
  peerData: Peer | null;
  serverPeerData: null;
  host: string;
  isConnected: boolean;
}
