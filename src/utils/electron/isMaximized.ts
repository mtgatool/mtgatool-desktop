import electron from "./electronWrapper";

export default function isMaximized() {
  if (electron) {
    return electron.remote.getCurrentWindow().isMaximized();
  }
  return false;
}
