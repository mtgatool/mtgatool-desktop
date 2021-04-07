import globalData from "./globalData";

export default function bcConnect() {
  const bc =
    globalData.broadcastChannel === null
      ? new BroadcastChannel("mtgatool-channel")
      : globalData.broadcastChannel;

  globalData.broadcastChannel = bc;
  return bc;
}
