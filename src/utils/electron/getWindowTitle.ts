import { WINDOW_MAIN } from "../../types/app";
import remote from "./remoteWrapper";

export default function getWindowTitle(): string {
  return remote ? remote.getCurrentWindow().getTitle() || "" : WINDOW_MAIN;
}
