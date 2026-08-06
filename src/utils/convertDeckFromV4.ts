import { ArenaV4DeckPayload, InternalDeck } from "../types";
import convertV4ListToV2 from "./convertV4ListToV2";
import Deck from "./mtga/deck";

/**
 * A deck in the `{ Summary, Deck }` shape, where each list is an array of
 * `{ cardId, quantity }`.
 *
 * Two labels send a deck like this — `Event_SetDeckV2` when a deck is picked
 * for an event, and `DeckUpsertDeckV3` when one is saved — so the conversion
 * lives here rather than in either handler.
 */
export default function convertDeckFromV4(json: ArenaV4DeckPayload): Deck {
  const main = convertV4ListToV2(json.Deck.MainDeck || []);
  const side = convertV4ListToV2(json.Deck.Sideboard || []);

  const deck: InternalDeck = {
    id: json.Summary.DeckId,
    name: json.Summary.Name || "",
    lastUpdated: "",
    deckTileId: json.Summary.DeckTileId,
    format: "",
    mainDeck: main,
    sideboard: side,
    commandZoneGRPIds: (json.Deck.CommandZone || []).map((c) => c.cardId),
    companionGRPId: (json.Deck.Companions || []).map((c) => c.cardId)[0],
    // No colors here: the deck works them out from its own lands, and doing it
    // twice is how the two ended up able to disagree.
    type: "InternalDeck",
  };

  return new Deck(deck);
}
