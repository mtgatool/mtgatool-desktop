import { OverlaySettings, Settings } from "../common/defaultConfig";
import { ALL_TAURI_OVERLAY_LABELS } from "../types/app";
import getLocalSetting from "../utils/getLocalSetting";
import isTauri from "../utils/tauri/isTauri";

export default async function createOverlay(
  id: number,
  callback?: () => void
): Promise<void> {
  if (!isTauri()) return;

  const allSettings = JSON.parse(getLocalSetting("settings")) as Settings;
  const settings: OverlaySettings = allSettings.overlays[id];
  const label = ALL_TAURI_OVERLAY_LABELS[id];

  console.warn("createOverlay", id, allSettings);

  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");

    // Check if window already exists
    const existingWindow = await WebviewWindow.getByLabel(label);
    if (existingWindow) {
      await existingWindow.show();
      return;
    }

    // Create new overlay window.
    // NOTE: coerce these explicitly. Persisted settings migrated from older
    // versions may omit `overlaysTransparency`/`overlayFrame`, and Tauri's JS
    // WebviewWindow treats `decorations: undefined` as true (title bar) and
    // `transparent: undefined` as false (opaque white) — which is exactly the
    // "framed + white overlay" bug. Default to frameless + transparent.
    const newWindow = new WebviewWindow(label, {
      url: "/", // Tauri serves from the build folder
      transparent: allSettings.overlaysTransparency !== false,
      decorations: allSettings.overlayFrame === true,
      shadow: false, // no drop-shadow border around the frameless overlay
      alwaysOnTop: true,
      skipTaskbar: true,
      width: settings.bounds.width,
      height: settings.bounds.height,
      x: settings.bounds.x,
      y: settings.bounds.y,
      visible: false,
      resizable: true,
      focus: false,
    });

    // Listen for window creation
    await newWindow.once("tauri://created", async () => {
      // Show window after a short delay
      setTimeout(async () => {
        try {
          await newWindow.show();
          await newWindow.setAlwaysOnTop(true);
        } catch (e) {
          console.error("Failed to show overlay:", e);
        }
      }, 250);
    });

    // Listen for window close
    await newWindow.once("tauri://close-requested", () => {
      if (callback) callback();
    });

    // Handle creation error
    await newWindow.once("tauri://error", (e) => {
      console.error("Failed to create overlay window:", e);
    });
  } catch (e) {
    console.error("Failed to create overlay:", e);
  }
}
