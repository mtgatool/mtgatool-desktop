import upsertDbCards from "../data/upsertDbCards";
import { Cards } from "../types";
import isElectron from "../utils/electron/isElectron";
import { getReader } from "../utils/mtgaReader";

export default async function readCards(): Promise<void> {
  if (!isElectron()) return;

  try {
    // Reads run on the native threadpool and return a Promise, so they never
    // block this renderer's event loop.
    const collection = await getReader().readCollection("MTGA");

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
