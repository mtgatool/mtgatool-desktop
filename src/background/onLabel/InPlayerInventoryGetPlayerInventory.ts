import { PlayerInventory } from "mtgatool-shared";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: PlayerInventory;
}

// DEPRECATED
export default function InPlayerInventoryGetPlayerInventory(
  entry: Entry
): void {
  const { json } = entry;

  postChannelMessage({
    type: "SET_UUID",
    value: json.playerId,
  });
}
