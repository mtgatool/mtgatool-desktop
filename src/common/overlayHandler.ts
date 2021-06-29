import closeOverlay from "../overlay/closeOverlay";
import createOverlay from "../overlay/createOverlay";
import store from "../redux/stores/rendererStore";
import { ALL_OVERLAYS } from "../types/app";
import electron from "../utils/electron/electronWrapper";
import { overlayTitleToId } from "./maps";

export class OverlayHandler {
  private _openState = [false, false, false, false, false];

  private _checkOverlaysState = () => {
    const currentStates = [false, false, false, false, false];
    if (electron) {
      electron.remote.BrowserWindow.getAllWindows().forEach((w) => {
        if (ALL_OVERLAYS.includes(w.getTitle())) {
          const id = overlayTitleToId[w.getTitle()];
          currentStates[id] = true;
        }
      });
    }
    return currentStates;
  };

  private _updateOverlays = () => {
    // currentStates is not the state we want, but the state we have
    const currentStates = this._checkOverlaysState();
    currentStates.forEach((state, index) => {
      if (state === true && this._openState[index] === false) {
        closeOverlay(index);
      }
      if (state === false && this._openState[index] === true) {
        createOverlay(index);
      }
    });
  };

  public settingsUpdated = () => {
    const { matchInProgress } = store.getState().renderer;

    store.getState().settings.overlays.forEach((overlay, index) => {
      this._openState[index] =
        (overlay.showAlways && overlay.show) ||
        (overlay.show && matchInProgress);
    });
    this._updateOverlays();
  };
}

if (!window.overlayHandler) {
  window.overlayHandler = new OverlayHandler();
}

export default window.overlayHandler;
