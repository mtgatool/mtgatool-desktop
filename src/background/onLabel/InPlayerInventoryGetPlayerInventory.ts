import { PlayerInventory } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: PlayerInventory;
}

export default function InPlayerInventoryGetPlayerInventory(
  entry: Entry
): void {
  const { json } = entry;

  postChannelMessage({
    type: "SET_UUID",
    value: json.playerId,
  });

  postChannelMessage({
    type: "PLAYER_INVENTORY",
    value: json,
  });
}
