import { Display, remote } from "electron";

export default function getPrimaryMonitor(): Display {
  return remote.screen.getPrimaryDisplay();
}
