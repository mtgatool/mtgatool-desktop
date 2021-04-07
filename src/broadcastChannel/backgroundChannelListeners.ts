import start from "../background/worker";
import bcConnect from "../utils/bcConnect";
import { ChannelMessage } from "./channelMessages";

export default function backgroundChannelListeners() {
  const channel = bcConnect() as any;

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    if (msg.data.type == "START_LOG_READING") {
      console.log("START LOG READING");
      start();
    }
  };
}
