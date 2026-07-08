import { ALL_TAURI_OVERLAY_LABELS } from "../types/app";
import isTauri from "../utils/tauri/isTauri";

export default async function closeOverlay(id: number): Promise<void> {
  if (!isTauri()) return;

  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const label = ALL_TAURI_OVERLAY_LABELS[id];
    const window = await WebviewWindow.getByLabel(label);

    if (window) {
      await window.close();
    }
  } catch (e) {
    console.error("Failed to close overlay:", e);
  }
}
