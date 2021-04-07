import globalData from "../utils/globalData";
import { ChannelMessage } from "./channelMessages";

export default function postChannelMessage(msg: ChannelMessage) {
  globalData.broadcastChannel?.postMessage(msg);
}
