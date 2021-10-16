import { useEffect } from "react";
import { useSelector } from "react-redux";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import overlayHandler from "../common/overlayHandler";
import { AppState } from "../redux/stores/rendererStore";
import setLocalSetting from "../utils/setLocalSetting";

export default function SettingsPersistor() {
  const settings = useSelector((state: AppState) => state.settings);

  useEffect(() => {
    if (overlayHandler) {
      overlayHandler.settingsUpdated();
    }
    setLocalSetting("settings", JSON.stringify(settings));

    postChannelMessage({
      type: "OVERLAY_UPDATE_SETTINGS",
    });
  }, [settings]);

  return <></>;
}
