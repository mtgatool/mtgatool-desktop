import upsertDbCards from "../data/upsertDbCards";
import { Cards } from "../types";
import isElectron from "../utils/electron/isElectron";
import { ReaderCollection } from "../utils/mtgaReader";

export default function readCards() {
  if (!isElectron()) return;
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  // mtga-reader 0.1.6: the collection is read via the typed readCollection,
  // which returns { count, cards: [{ grpId, qty }] }. The old generic readData
  // path used stale 0.1.5 field names and no longer returns an array.
  const collection: ReaderCollection & { error?: string } =
    reader.readCollection("MTGA");

  if (!collection || collection.error || !Array.isArray(collection.cards)) {
    return;
  }

  const parsedCards: Cards = {};
  collection.cards.forEach((c) => {
    parsedCards[c.grpId] = c.qty;
  });

  upsertDbCards(parsedCards);
}
