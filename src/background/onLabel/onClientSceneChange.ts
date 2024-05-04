import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readCards from "../../reader/readCards";
import LogEntry, { ClientSceneChange } from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ClientSceneChange;
}

export default function onClientSceneChange(entry: Entry): void {
  const { json } = entry;

  if (json.fromSceneName === "Draft") {
    postChannelMessage({
      type: "DRAFT_END",
    });
  }

  if (json.fromSceneName === "BoosterChamber") {
    readCards();
  }

  postChannelMessage({
    type: "SET_SCENE",
    value: json,
  });
}
