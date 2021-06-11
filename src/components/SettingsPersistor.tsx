import { useEffect } from "react";
import { useSelector } from "react-redux";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { AppState } from "../redux/stores/rendererStore";
import setLocalSetting from "../utils/setLocalSetting";

export default function SettingsPersistor() {
  const { settings } = useSelector((state: AppState) => state);

  useEffect(() => {
    setLocalSetting("settings", JSON.stringify(settings));

    postChannelMessage({
      type: "OVERLAY_UPDATE_SETTINGS",
    });
  }, [settings]);

  return <></>;
}
