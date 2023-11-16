import remote from "./remoteWrapper";

export default function isMaximized() {
  if (remote) {
    return remote.getCurrentWindow().isMaximized();
  }
  return false;
}
