import { InternalDeck } from "mtgatool-shared";

import getPreconDeckName from "./getPreconDeckName";

export default function prettierDeckData(data: InternalDeck): InternalDeck {
  const deckData = { ...data };
  if (deckData.name.includes("?=?Loc")) {
    deckData.name =
      getPreconDeckName(deckData.name.replace("?=?Loc/", "")) ||
      "Preconstructed Deck";
  }
  return deckData;
}
