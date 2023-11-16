import { BrowserWindow } from "electron";

import { ALL_OVERLAYS } from "../types/app";
import remote from "../utils/electron/remoteWrapper";

export default function closeOverlay(id: number) {
  if (remote) {
    const overlayTitle = ALL_OVERLAYS[id];
    remote.BrowserWindow.getAllWindows().forEach((w: BrowserWindow) => {
      if (w.getTitle() == overlayTitle) {
        w.close();
        w.destroy();
      }
    });
  }
}
