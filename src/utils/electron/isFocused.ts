import remote from "./remoteWrapper";

export default function isFocused() {
  if (remote) {
    return remote.getCurrentWindow().isFocused();
  }
  return false;
}
