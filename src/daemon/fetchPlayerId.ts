import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default function fetchPlayerId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (globalData.daemon) {
      globalData.daemon.getPlayerId().then((d) => {
        if (
          d &&
          d.personaId !== "undefined" &&
          d.personaId !== "" &&
          d.personaId
        ) {
          switchPlayerUUID(d.personaId, d.displayName);
          resolve(d.personaId);
        } else {
          resolve(undefined);
        }
      });
    } else {
      resolve(undefined);
    }
  });
}
