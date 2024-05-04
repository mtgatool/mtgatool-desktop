import { Cards } from "mtgatool-shared";

import upsertDbCards from "../toolDb/upsertDbCards";
import isElectron from "../utils/electron/isElectron";

interface ReaderCard {
  key: number;
  value: number;
  hashCode: number;
  next: number;
}

export default function readCards() {
  if (!isElectron()) return;
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const { readData } = reader;

  const cards = readData("MTGA", [
    "WrapperController",
    "<Instance>k__BackingField",
    "<InventoryManager>k__BackingField",
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
