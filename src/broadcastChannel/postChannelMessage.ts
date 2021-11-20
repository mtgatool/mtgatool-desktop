import { ChannelMessage } from "./channelMessages";

export default function postChannelMessage(msg: ChannelMessage) {
  if ((window as any).backGlobalData) {
    (window as any).backGlobalData.broadcastChannel?.postMessage(msg);
  }

  if ((window as any).globalData) {
    (window as any).globalData.broadcastChannel?.postMessage(msg);
  }
}
