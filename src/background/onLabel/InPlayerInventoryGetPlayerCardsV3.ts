import { Cards } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";

interface Entry extends LogEntry {
  json: Cards;
}

export default function InPlayerInventoryGetPlayerCardsV3(entry: Entry): void {
  const { json } = entry;

  let loops = 0;
  // This is hacky-hack. I set up a loop to wait for the UUID.
  const interval = setInterval(() => {
    const uuid = getLocalSetting("playerId");
    if (uuid && uuid !== "") {
      postChannelMessage({
        type: "UPSERT_DB_CARDS",
        value: json,
      });
      clearInterval(interval);
    } else if (loops > 100) {
      clearInterval(interval);
    }
    loops += 1;
  }, 1000);
}
