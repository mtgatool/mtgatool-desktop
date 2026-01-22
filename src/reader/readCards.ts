import upsertDbCards from "../toolDb/upsertDbCards";
import { Cards } from "../types";
import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";

interface ReaderCard {
  key: number;
  value: number;
  hashCode: number;
  next: number;
}

export default async function readCards() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  const cards = await readData("MTGA", [
    "PAPA",
    "_instance",
    "_inventoryManager",
    "_inventoryServiceWrapper",
    "<Cards>k__BackingField",
    "_entries",
  ]);

  if (!cards || cards.error) return;

  const parsedCards: Cards = {};
  cards.forEach((c: ReaderCard) => {
    parsedCards[c.key] = c.value;
  });

  upsertDbCards(parsedCards);
}
