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
import store from "../redux/stores/rendererStore";
import getLocalSetting from "../utils/getLocalSetting";
import {
  closeOverlayWindow,
  createOverlayWindow,
  getAllOverlayWindows,
} from "../utils/tauri/overlayWindow";
import { Settings } from "./defaultConfig";

export class OverlayHandlerTauri {
  private _openState = [false, false, false, false, false];

  private _checkOverlaysState = async (): Promise<boolean[]> => {
    const currentStates = [false, false, false, false, false];
    try {
      const overlayLabels = await getAllOverlayWindows();
      overlayLabels.forEach((label) => {
        const match = label.match(/overlay-(\d+)/);
        if (match) {
          const id = parseInt(match[1], 10);
          if (id >= 0 && id < 5) {
            currentStates[id] = true;
          }
        }
      });
    } catch (e) {
      console.error("Failed to check overlay states:", e);
    }
    return currentStates;
  };

  private _updateOverlays = async () => {
    // currentStates is not the state we want, but the state we have
    const currentStates = await this._checkOverlaysState();

    await Promise.all(
      currentStates.map(async (state, index) => {
        if (state === true && this._openState[index] === false) {
          // Close overlay that should be closed
          try {
            await closeOverlayWindow(`overlay-${index}`);
          } catch (e) {
            console.error(`Failed to close overlay ${index}:`, e);
          }
        }

        if (state === false && this._openState[index] === true) {
          // Create overlay that should be open
          try {
            const allSettings = JSON.parse(
              getLocalSetting("settings")
            ) as Settings;
            const settings = allSettings.overlays[index];

            await createOverlayWindow(
              `overlay-${index}`,
              {
                x: settings.bounds.x,
                y: settings.bounds.y,
                width: settings.bounds.width,
                height: settings.bounds.height,
              },
              allSettings.overlaysTransparency
            );
          } catch (e) {
            console.error(`Failed to create overlay ${index}:`, e);
          }
        }
      })
    );
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

// Create singleton instance
declare global {
  interface Window {
    overlayHandlerTauri?: OverlayHandlerTauri;
  }
}

if (!window.overlayHandlerTauri) {
  window.overlayHandlerTauri = new OverlayHandlerTauri();
}

export default window.overlayHandlerTauri;
