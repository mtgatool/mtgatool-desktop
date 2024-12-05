import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV3 from "../../utils/convertDeckFromV3";
import selectDeck from "../selectDeck";

interface EntryJson {
  params: {
    deck: string;
    opponentDisplayName: string;
    playFirst: boolean;
    bo3: boolean;
  };
}

interface Entry extends LogEntry {
  json: EntryJson;
}

export default function OutDirectGameChallenge(entry: Entry): void {
  const { json } = entry;

  const { deck } = json.params;
  const parsedDeck = JSON.parse(deck) as ArenaV3Deck;
  const convertedDeck = convertDeckFromV3(parsedDeck);
  selectDeck(convertedDeck);
}
