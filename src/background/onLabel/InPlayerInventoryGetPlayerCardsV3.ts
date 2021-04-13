import { Cards } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: Cards;
}

export default function InPlayerInventoryGetPlayerCardsV3(entry: Entry): void {
  const { json } = entry;

  postChannelMessage({
    type: "UPSERT_GUN_CARDS",
    value: json,
  });
}
