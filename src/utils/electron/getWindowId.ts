import { remote } from "electron";

export default function getWindowId(): number {
  return remote.getCurrentWindow().id;
}
