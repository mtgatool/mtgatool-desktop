import remote from "./remoteWrapper";

export default function minimizeWindow() {
  if (remote) remote.getCurrentWindow().minimize();
}
