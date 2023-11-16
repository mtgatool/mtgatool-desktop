import remote from "./remoteWrapper";

export default function setFocusable(set: boolean) {
  if (remote) {
    remote.getCurrentWindow().setFocusable(set);
    if (set) {
      remote.getCurrentWindow().focus();
    }
  }
}
