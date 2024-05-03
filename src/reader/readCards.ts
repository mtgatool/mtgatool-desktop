import { Cards } from "mtgatool-shared";

import upsertDbCards from "../toolDb/upsertDbCards";

// eslint-disable-next-line no-undef
const reader = __non_webpack_require__("mtga-reader");

const { readData } = reader;

interface ReaderCard {
  key: number;
  value: number;
  hashCode: number;
  next: number;
}

export default function readCards() {
  const cards = readData("MTGA", [
    "WrapperController",
    "<Instance>k__BackingField",
    "<InventoryManager>k__BackingField",
    "_inventoryServiceWrapper",
    "<Cards>k__BackingField",
    "_entries",
  ]);

  const parsedCards: Cards = {};
  cards.forEach((c: ReaderCard) => {
    parsedCards[c.key] = c.value;
  });

  upsertDbCards(parsedCards);
}
