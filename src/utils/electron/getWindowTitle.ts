import { WINDOW_MAIN } from "../../types/app";
import electron from "./electronWrapper";

export default function getWindowTitle(): string {
  return electron
    ? electron.remote.getCurrentWindow().getTitle() || ""
    : WINDOW_MAIN;
}
