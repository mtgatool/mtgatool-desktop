import { ALL_OVERLAYS } from "../types/app";
import electron from "../utils/electron/electronWrapper";

export default function closeOverlay(id: number) {
  if (electron) {
    const overlayTitle = ALL_OVERLAYS[id];
    electron.remote.BrowserWindow.getAllWindows().forEach((w) => {
      if (w.getTitle() == overlayTitle) {
        w.close();
        w.destroy();
      }
    });
  }
}
