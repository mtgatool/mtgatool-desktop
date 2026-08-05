// import postChannelMessage from "../../broadcastChannel/postChannelMessage";

import { ArenaV4DeckPayload } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV4 from "../../utils/convertDeckFromV4";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: ArenaV4DeckPayload & {
    EventName: string;
  };
}

export default function OutSetDeckV2(entry: Entry): any {
  const { json } = entry;

  selectDeck(convertDeckFromV4(json));
  // postChannelMessage({
  //   type: "UPSERT_DB_DECK",
  //   value: deck,
  // });

  return json;
}
