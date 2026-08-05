import { ArenaV4DeckPayload } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV4 from "../../utils/convertDeckFromV4";
import { cacheDeck } from "../deckCache";

interface Entry extends LogEntry {
  json: ArenaV4DeckPayload;
}

/**
 * Arena saving a deck — on an edit, and on `LastPlayed` when one is queued.
 *
 * Only remembered, never selected: this fires while browsing the deck builder
 * too, so treating it as "the deck being played" would make the overlay follow
 * whatever was last edited. `OutEventAiBotMatch` is what selects one, by id.
 *
 * The outgoing side is the one with the payload; the response is a bare
 * `DeckUpsertDeckV3(<uuid>)` with no body at all.
 */
export default function OutDeckUpsertDeckV3(entry: Entry): void {
  const { json } = entry;
  if (!json?.Summary?.DeckId || !json.Deck) return;

  cacheDeck(convertDeckFromV4(json));
}
