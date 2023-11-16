import reduxAction from "../redux/reduxAction";
import store, { AppState } from "../redux/stores/rendererStore";
import electron from "./electron/electronWrapper";
import remote from "./electron/remoteWrapper";

export default function registerShortcuts(settings: AppState["settings"]) {
  if (remote && electron) {
    remote.globalShortcut.unregisterAll();
    if (settings.enableKeyboardShortcuts) {
      electron.ipcRenderer.send(
        "ipc_switch",
        "setDevtoolsShortcut",
        settings.shortcutDevtoolsMain
      );

      settings.overlays?.forEach((_settings: any, ii: number) => {
        const short = `shortcutOverlay${ii + 1}`;
        if (remote) {
          try {
            remote.globalShortcut.register((settings as any)[short], () => {
              const { show } = store.getState().settings.overlays[ii];
              reduxAction(store.dispatch, {
                type: "SET_OVERLAY_SETTINGS",
                arg: { id: ii, settings: { show: !show } },
              });
            });
          } catch (e) {
            console.warn(e);
          }
        }
      });
    }
  }
}
