import sha1 from "../../utils/sha1";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { InventoryUpdate } from "../../types";
import LogEntry from "../../types/logDecoder";

interface EntryJson {
  context: string;
  updates: InventoryUpdate[];
}

interface Entry extends LogEntry {
  json: EntryJson;
}

// Called for all "Inventory.Updated" labels
export default function InventoryUpdated(entry: Entry): void {
  const transaction = entry.json;

  transaction.updates.forEach((update: InventoryUpdate) => {
    postChannelMessage({
      type: "INVENTORY_UPDATED",
      value: update,
      context: `${transaction.context}.${update.context.source}`,
      id: sha1(JSON.stringify(update) + entry.hash),
    });
  });
}
