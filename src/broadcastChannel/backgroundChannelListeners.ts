import start from "../background/worker";
import bcConnect from "../utils/bcConnect";
import electron from "../utils/electron/electronWrapper";
import { ChannelMessage } from "./channelMessages";
import postChannelMessage from "./postChannelMessage";

export default function backgroundChannelListeners() {
  const channel = bcConnect() as any;

  if (electron) {
    // eslint-disable-next-line no-undef
    // const ffi = __non_webpack_require__("ffi-napi");

    // const MtgaSpy = new ffi.Library(`${__dirname}/extra/HackF5.UnitySpy`, {
    //   GetPID: ["int", ["string"]],
    //   GetUUID: ["string", ["int"]],
    // });
    // console.log("MtgaSpy ok");

    // const pid = MtgaSpy.GetPID("MTGA");
    // console.log("PID", pid);
    // console.log("UUID", MtgaSpy.GetUUID(pid));

    channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type == "START_LOG_READING") {
        console.log("START LOG READING");
        start();
      }
    };

    electron.ipcRenderer.on("peersFound", (event: any, d: any) =>
      postChannelMessage({
        type: "DATABASE_PEERS",
        peers: d,
      })
    );
    electron.ipcRenderer.on("rendererInit", (event: any, d: any) =>
      console.log("rendererInit", d)
    );
  }
}
