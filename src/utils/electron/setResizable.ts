import { remote } from "electron";

export default function setResizable(set: boolean) {
  remote.getCurrentWindow().setResizable(set);
}
