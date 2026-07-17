import upsertDbCards from "../data/upsertDbCards";
import { Cards } from "../types";
import isElectron from "../utils/electron/isElectron";
import { ReaderCollection } from "../utils/mtgaReader";

export default async function readCards(): Promise<void> {
  if (!isElectron()) return;

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    // mtga-reader 0.1.7: reads run on the native threadpool and return a
    // Promise, so they never block this renderer's event loop. Returns
    // { count, cards: [{ grpId, qty }] }.
    const collection: ReaderCollection & { error?: string } =
      await reader.readCollection("MTGA");

    if (!collection || collection.error || !Array.isArray(collection.cards)) {
      return;
    }

    const parsedCards: Cards = {};
    collection.cards.forEach((c) => {
      parsedCards[c.grpId] = c.qty;
    });

    upsertDbCards(parsedCards);
  } catch (e) {
    console.error("readCards failed:", e);
  }
}
