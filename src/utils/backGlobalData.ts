import { defaultSettings } from "../types/localSettings";

const backGlobalData = {
  broadcastChannel: null as BroadcastChannel | null,
  lastLogCheck: 0,
  localSettingsProxy: defaultSettings,
};

(window as any).backGlobalData = backGlobalData;

export default backGlobalData;
