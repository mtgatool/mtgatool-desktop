import { database, DbCardDataV2 } from "mtgatool-shared";

import findSetByCode from "./findSetByCode";
import openExternal from "./openExternal";

export default function openScryfallCard(card?: DbCardDataV2 | number): void {
  const cardObj = typeof card == "number" ? database.card(card) : card;
  if (cardObj) {
    const { CollectorNumber, Set } = cardObj;
    const token = cardObj.IsToken ? "t" : "";

    const setObj = findSetByCode(Set);

    if (setObj) {
      openExternal(
        `https://scryfall.com/card/${token}${setObj.scryfall}/${CollectorNumber}`
      );
    }
  } else {
    console.error(`Cant open scryfall card: ${cardObj}`);
  }
}
