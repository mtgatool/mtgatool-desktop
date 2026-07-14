import {
  OVERLAY_DRAFT,
  OVERLAY_DRAFT_BREW,
  OVERLAY_FULL,
  OVERLAY_LEFT,
  OVERLAY_LOG,
  OVERLAY_MIXED,
  OVERLAY_ODDS,
  OVERLAY_SEEN,
} from "../constants";
import closeOverlay from "../overlay/closeOverlay";
import createOverlay from "../overlay/createOverlay";
import store from "../redux/stores/rendererStore";
import { ALL_TAURI_OVERLAY_LABELS } from "../types/app";
import isTauri from "../utils/tauri/isTauri";

export class OverlayHandler {
  private _openState = [false, false, false, false, false];

  // _updateOverlays is async (it probes each window). settingsUpdated fires on
  // every settings change, so without serialization concurrent runs race and
  // thrash create/close (the flicker). Run one at a time; coalesce extra calls
  // into a single trailing re-run.
  private _updating = false;

  private _rerun = false;

  private _checkOverlaysState = async (): Promise<boolean[]> => {
    const currentStates = [false, false, false, false, false];

    if (!isTauri()) return currentStates;

    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");

      for (let i = 0; i < ALL_TAURI_OVERLAY_LABELS.length; i += 1) {
        const label = ALL_TAURI_OVERLAY_LABELS[i];
        // eslint-disable-next-line no-await-in-loop
        const window = await WebviewWindow.getByLabel(label);
        if (window) {
          currentStates[i] = true;
        }
      }
    } catch (e) {
      console.error("Failed to check overlay states:", e);
    }

    return currentStates;
  };

  private _updateOverlays = async () => {
    if (this._updating) {
      this._rerun = true;
      return;
    }
    this._updating = true;
    try {
      // currentStates is not the state we want, but the state we have
      const currentStates = await this._checkOverlaysState();
      currentStates.forEach((exists, index) => {
        if (this._openState[index]) {
          // Idempotent on purpose: createOverlay creates the window when it's
          // absent AND re-shows it when it already exists. An overlay can't make
          // itself visible — only the handler can — and a freshly-created window
          // can be left hidden if createOverlay's deferred .show() lost the race
          // with the "tauri://created" event. Calling createOverlay every pass
          // (not only on the false→true edge) guarantees the visibility is
          // applied, instead of needing a second settings change to take hold.
          createOverlay(index);
        } else if (exists) {
          closeOverlay(index);
        }
      });
    } finally {
      this._updating = false;
      if (this._rerun) {
        this._rerun = false;
        this._updateOverlays();
      }
    }
  };

  public settingsUpdated = () => {
    const { matchInProgress, draftInProgress } = store.getState().renderer;

    store.getState().settings.overlays.forEach((overlay, index) => {
      this._openState[index] =
        (overlay.showAlways && overlay.show) ||
        ((overlay.mode === OVERLAY_SEEN ||
          overlay.mode === OVERLAY_FULL ||
          overlay.mode === OVERLAY_LEFT ||
          overlay.mode === OVERLAY_LOG ||
          overlay.mode === OVERLAY_MIXED ||
          overlay.mode === OVERLAY_ODDS) &&
          overlay.show &&
          matchInProgress) ||
        ((overlay.mode === OVERLAY_DRAFT ||
          overlay.mode === OVERLAY_DRAFT_BREW) &&
          overlay.show &&
          draftInProgress);
    });
    this._updateOverlays();
  };
}

if (!window.overlayHandler) {
  window.overlayHandler = new OverlayHandler();
}

export default window.overlayHandler;
