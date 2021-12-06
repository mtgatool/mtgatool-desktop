import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default function fetchPlayerId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (globalData.daemon) {
      globalData.daemon.getPlayerId().then((pid) => {
        if (pid && pid !== "") {
          switchPlayerUUID(pid);
          resolve(pid);
        } else {
          resolve(undefined);
        }
      });
    } else {
      resolve(undefined);
    }
  });
}
