export default function bcConnect() {
  let globalData = (window as any).backGlobalData;
  if (!globalData) {
    globalData = (window as any).globalData;
  }

  const bc =
    globalData.broadcastChannel === null
      ? new BroadcastChannel("mtgatool-channel")
      : globalData.broadcastChannel;

  globalData.broadcastChannel = bc;
  return bc;
}
