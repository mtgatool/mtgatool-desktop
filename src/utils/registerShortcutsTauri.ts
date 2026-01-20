import { listen } from "@tauri-apps/api/event";

import reduxAction from "../redux/reduxAction";
import store, { AppState } from "../redux/stores/rendererStore";
import { registerShortcut, unregisterAllShortcuts } from "./tauri/shortcuts";

export default async function registerShortcutsTauri(
  settings: AppState["settings"]
): Promise<void> {
  await unregisterAllShortcuts();

  if (settings.enableKeyboardShortcuts) {
    // Register overlay toggle shortcuts
    const promises: Promise<void>[] = [];

    for (let ii = 0; ii < (settings.overlays?.length || 0); ii += 1) {
      const shortcutKey = `shortcutOverlay${ii + 1}` as keyof typeof settings;
      const shortcut = settings[shortcutKey] as unknown as string;

      if (shortcut) {
        const eventName = `toggle_overlay_${ii}`;
        const overlayIndex = ii; // Capture for closure

        // Collect registration promise
        promises.push(
          registerShortcut(shortcut, eventName).catch((e) => {
            console.warn(`Failed to register shortcut ${shortcut}:`, e);
          })
        );

        // Set up listener
        promises.push(
          listen(eventName, () => {
            const { show } = store.getState().settings.overlays[overlayIndex];
            reduxAction(store.dispatch, {
              type: "SET_OVERLAY_SETTINGS",
              arg: { id: overlayIndex, settings: { show: !show } },
            });
          }).then(() => undefined) // Convert to Promise<void>
        );
      }
    }

    // Wait for all operations to complete
    await Promise.all(promises);

    // Register devtools shortcut if needed
    if (settings.shortcutDevtoolsMain) {
      try {
        await registerShortcut(
          settings.shortcutDevtoolsMain,
          "toggle_devtools"
        );
        listen("toggle_devtools", () => {
          // Devtools toggle is handled by Tauri natively in dev mode
          console.log("DevTools shortcut triggered");
        });
      } catch (e) {
        console.warn("Failed to register devtools shortcut:", e);
      }
    }
  }
}
