import bcConnect from "../utils/bcConnect";
import { ChannelMessage } from "./channelMessages";

export default function overlayChannelListeners() {
  const channel = bcConnect() as any;

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);

    if (msg.data.type === "OVERLAY_UPDATE") {
      console.log(msg.data.value);
    }
  };
}
