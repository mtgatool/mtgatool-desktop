import reduxAction from "../redux/reduxAction";
import store, { AppState } from "../redux/stores/rendererStore";
import isTauri from "./tauri/isTauri";

// Keep track of registered shortcuts for cleanup
let registeredShortcuts: string[] = [];

export async function unregisterAllShortcuts(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { unregisterAll } = await import(
      "@tauri-apps/plugin-global-shortcut"
    );
    await unregisterAll();
    registeredShortcuts = [];
  } catch (e) {
    console.error("Failed to unregister shortcuts:", e);
  }
}

async function registerShortcut(
  shortcut: string,
  callback: () => void
): Promise<void> {
  if (!isTauri() || !shortcut) return;

  try {
    const { register, isRegistered } = await import(
      "@tauri-apps/plugin-global-shortcut"
    );

    // Check if already registered
    const alreadyRegistered = await isRegistered(shortcut);
    if (alreadyRegistered) {
      console.warn(`Shortcut ${shortcut} is already registered`);
      return;
    }

    await register(shortcut, callback);
    registeredShortcuts.push(shortcut);
  } catch (e) {
    console.warn(`Failed to register shortcut ${shortcut}:`, e);
  }
}

export default async function registerShortcuts(
  settings: AppState["settings"]
): Promise<void> {
  if (!isTauri()) return;

  // Unregister all existing shortcuts first
  await unregisterAllShortcuts();

  if (!settings.enableKeyboardShortcuts) return;

  // Register overlay toggle shortcuts
  if (settings.overlays) {
    for (let ii = 0; ii < settings.overlays.length; ii += 1) {
      const shortcutKey = `shortcutOverlay${ii + 1}` as keyof typeof settings;
      const shortcut = settings[shortcutKey] as string;

      if (shortcut) {
        // eslint-disable-next-line no-await-in-loop
        await registerShortcut(shortcut, () => {
          const { show } = store.getState().settings.overlays[ii];
          reduxAction(store.dispatch, {
            type: "SET_OVERLAY_SETTINGS",
            arg: { id: ii, settings: { show: !show } },
          });
        });
      }
    }
  }
}
