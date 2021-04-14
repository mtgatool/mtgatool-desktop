import electron from "./electronWrapper";

export default function hideWindow() {
  if (electron && electron.remote.getCurrentWindow().isVisible()) {
    electron.remote.getCurrentWindow().hide();
  }
}
