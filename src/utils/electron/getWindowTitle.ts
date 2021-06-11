import electron from "./electronWrapper";

export default function getWindowTitle(): string {
  return electron?.remote.getCurrentWindow().getTitle() || "";
}
