import { PlayerInventory } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import setLocalSetting from "../../utils/setLocalSetting";

interface Entry extends LogEntry {
  json: PlayerInventory;
}

export default function InPlayerInventoryGetPlayerInventory(
  entry: Entry
): void {
  const { json } = entry;

  setLocalSetting("playerId", json.playerId);

  postChannelMessage({
    type: "PLAYER_INVENTORY",
    value: json,
  });
}
