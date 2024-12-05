import { DbCardDataV2 } from "../types";
import findSetByCode from "./findSetByCode";
import database from "./mtga/database";
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
