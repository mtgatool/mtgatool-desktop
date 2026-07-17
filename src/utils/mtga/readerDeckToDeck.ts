import { ReaderDeck } from "../mtgaReader";
import Deck from "./deck";

/**
 * Convert a memory-read ReaderDeck (name/deckId/attributes + per-pile card
 * lists) into the app's Deck. The Main pile becomes the mainboard and the
 * Sideboard pile the sideboard; other piles (command zone / companions) are
 * left out of the 60/15 lists for now.
 */
export default function readerDeckToDeck(readerDeck: ReaderDeck): Deck {
  const pile = (name: string) =>
    (readerDeck.piles.find((p) => p.pileName === name)?.cards || []).map(
      (c) => ({ id: c.grpId, quantity: c.qty })
    );

  return new Deck(
    {
      id: readerDeck.deckId,
      name: readerDeck.name,
      deckTileId: readerDeck.tileId,
    },
    pile("Main"),
    pile("Sideboard")
  );
}
