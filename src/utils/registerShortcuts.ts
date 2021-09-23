import reduxAction from "../redux/reduxAction";
import store, { AppState } from "../redux/stores/rendererStore";
import electron from "./electron/electronWrapper";

export default function registerShortcuts(settings: AppState["settings"]) {
  if (electron) {
    electron.remote.globalShortcut.unregisterAll();
    if (settings.enableKeyboardShortcuts) {
      electron.ipcRenderer.send(
        "setDevtoolsShortcut",
        settings.shortcutDevtoolsMain
      );

      settings.overlays?.forEach((_settings: any, ii: number) => {
        const short = `shortcutOverlay${ii + 1}`;
        if (electron) {
          electron.remote.globalShortcut.register(
            (settings as any)[short],
            () => {
              const { show } = store.getState().settings.overlays[ii];
              reduxAction(store.dispatch, {
                type: "SET_OVERLAY_SETTINGS",
                arg: { id: ii, settings: { show: !show } },
              });
            }
          );
        }
      });
    }
  }
}
