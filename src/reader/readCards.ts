import upsertDbCards from "../data/upsertDbCards";
import { Cards } from "../types";
import { isMemoryReadingAvailable, readCollection } from "../utils/mtgaReader";

export default async function readCards() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  const collection = await readCollection("MTGA");

  if (!collection || !collection.cards || collection.cards.length === 0) return;

  const parsedCards: Cards = {};
  collection.cards.forEach((c) => {
    parsedCards[c.grpId] = c.qty;
  });

  upsertDbCards(parsedCards);
}
