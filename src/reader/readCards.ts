import upsertDbCards from "../toolDb/upsertDbCards";
import { Cards } from "../types";
import isTauri from "../utils/tauri/isTauri";

interface ReaderCard {
  key: number;
  value: number;
  hashCode: number;
  next: number;
}

export default function readCards() {
  if (!isTauri()) return;
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const { readData } = reader;

  const cards = readData("MTGA", [
    "PAPA",
    "_instance",
    "_inventoryManager",
    "_inventoryServiceWrapper",
    "<Cards>k__BackingField",
    "_entries",
  ]);

  if (cards.error) return;

  const parsedCards: Cards = {};
  cards.forEach((c: ReaderCard) => {
    parsedCards[c.key] = c.value;
  });

  upsertDbCards(parsedCards);
}
