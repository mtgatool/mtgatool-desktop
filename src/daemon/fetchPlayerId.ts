import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default function fetchPlayerId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (globalData.daemon) {
      globalData.daemon.getPlayerId().then((d) => {
        if (d && d.playerId !== "") {
          switchPlayerUUID(d.playerId, d.displayName);
          resolve(d.playerId);
        } else {
          resolve(undefined);
        }
      });
    } else {
      resolve(undefined);
    }
  });
}
