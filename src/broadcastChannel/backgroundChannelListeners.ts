import globalStore from "../background/store";
import start from "../background/worker";
import bcConnect from "../utils/bcConnect";
import defaultLogUri from "../utils/defaultLogUri";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import setLocalSetting from "../utils/setLocalSetting";
import loadDraftRatings from "../utils/seventeenLands";
import { ChannelMessage } from "./channelMessages";
import postChannelMessage from "./postChannelMessage";

export default function backgroundChannelListeners() {
  const channel = bcConnect() as any;

  let stopFn: undefined | (() => void);

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    if (msg.data.type == "START_LOG_READING" && stopFn === undefined) {
      console.log("START LOG READING");
      stopFn = start();
    }

    if (msg.data.type == "STOP_LOG_READING" && stopFn !== undefined) {
      console.log("STOP LOG READING");
      stopFn();
      stopFn = undefined;
    }

    // A draft overlay finished booting and missed the DRAFT_STATUS that opened
    // it (the broadcast fired while the window was still loading). Re-send the
    // current state so it doesn't sit empty until the next pick.
    if (msg.data.type == "DRAFT_STATUS_REQUEST") {
      const draft = globalStore.currentDraft;
      if (draft.eventId) {
        postChannelMessage({ type: "DRAFT_STATUS", value: draft });
        loadDraftRatings(draft.eventId);
      }
    }
  };

  if (electron) {
    electron.ipcRenderer.on("rendererInit", (event: any, d: any) => {
      const logUri = getLocalSetting("logPath");
      if (!logUri || logUri.indexOf("undefined/") > -1) {
        setLocalSetting("logPath", defaultLogUri());
      }
      console.log("rendererInit", d);
    });
  }
}
