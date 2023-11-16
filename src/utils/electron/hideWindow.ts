import remote from "./remoteWrapper";

export default function hideWindow() {
  if (remote && remote.getCurrentWindow().isVisible()) {
    remote.getCurrentWindow().hide();
  }
}
