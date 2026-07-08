import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry, { ClientSceneChange } from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ClientSceneChange;
}

/**
 * Runs in the background (log-watcher) context. It only forwards the scene
 * transition to the main window; the actual memory reads triggered by scene
 * changes live in reader/sceneSync (main window, where the visible store is).
 */
export default function onClientSceneChange(entry: Entry): void {
  const { json } = entry;

  if (json.fromSceneName === "Draft") {
    postChannelMessage({
      type: "DRAFT_END",
    });
  }

  // NOTE: entering a "Draft" scene is the only remaining draft signal in the
  // log; pack/pick data must come from memory once the reader exposes it.

  postChannelMessage({
    type: "SET_SCENE",
    value: json,
  });
}
