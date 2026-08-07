import cardsDb from "../utils/cardsDb/cardsDbClient";
import Deck from "../utils/mtga/deck";
import globalStore from "./store";

export default function selectDeck(selectedDeck: Deck): void {
  globalStore.currentMatch = {
    ...globalStore.currentMatch,
    originalDeck: selectedDeck.clone(),
    currentDeck: selectedDeck.clone(),
  };

  // Pull the deck's cards into the cache. `database.card()` is a synchronous
  // read of whatever has already been fetched, and the draw odds are computed
  // here in the background window from pure code — no component, so nothing
  // else ever asks for these cards. Without this every lookup returns
  // undefined, and the deck reads as having no lands, no creatures and no
  // spells: the odds all come out zero and the overlay's land breakdown has
  // nothing to show.
  //
  // Fire and forget, because every caller is on a synchronous log-handling
  // path. The odds are recomputed on each GRE message, so the first few may be
  // zero and then correct themselves once this lands.
  const ids = [
    ...selectedDeck.getMainboard().get(),
    ...selectedDeck.getSideboard().get(),
  ].map((card) => card.id);

  if (ids.length) {
    cardsDb.cards([...new Set(ids)]).catch(() => undefined);
  }
}
