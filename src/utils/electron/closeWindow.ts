import remote from "./remoteWrapper";

export default function closeWindow() {
  if (remote) remote.getCurrentWindow().close();
}
