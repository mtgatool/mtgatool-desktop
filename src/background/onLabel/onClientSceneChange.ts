import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry, { ClientSceneChange } from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ClientSceneChange;
}

export default function onClientSceneChange(entry: Entry): void {
  const { json } = entry;

  postChannelMessage({
    type: "SET_SCENE",
    value: json,
  });
}
