import globalData from "../utils/globalData";
import { DaemonMatchState } from "./mtgaTrackerDaemon";

export default function fetchMatchState(): Promise<
  DaemonMatchState | undefined
> {
  return new Promise((resolve) => {
    if (globalData.daemon) {
      globalData.daemon.getMatchState().then((state) => {
        resolve(state || undefined);
      });
    } else {
      resolve(undefined);
    }
  });
}
