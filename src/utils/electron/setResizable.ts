import remote from "./remoteWrapper";

export default function setResizable(set: boolean) {
  if (remote) remote.getCurrentWindow().setResizable(set);
}
