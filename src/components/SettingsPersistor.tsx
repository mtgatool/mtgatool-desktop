import { useEffect } from "react";
import { useSelector } from "react-redux";

import postChannelMessage from "../broadcastChannel/postChannelMessage";
import overlayHandler from "../common/overlayHandler";
import { AppState } from "../redux/stores/rendererStore";
import setLocalSetting from "../utils/setLocalSetting";

export default function SettingsPersistor() {
  const settings = useSelector((state: AppState) => state.settings);

  useEffect(() => {
    // Persist and broadcast BEFORE reacting: settingsUpdated() may spawn an
    // overlay window, and a fresh overlay reads getLocalSetting("settings") on
    // mount (createOverlay for bounds/transparency, overlay/index.tsx for its
    // content). If we create the window before writing localStorage it comes up
    // with the previous settings and renders blank until the next settings
    // change — which is why enabling an overlay only "took effect" after
    // switching the overlay sub-tab.
    setLocalSetting("settings", JSON.stringify(settings));

    postChannelMessage({
      type: "OVERLAY_UPDATE_SETTINGS",
    });

    if (overlayHandler) {
      overlayHandler.settingsUpdated();
    }
  }, [settings]);

  return <></>;
}
