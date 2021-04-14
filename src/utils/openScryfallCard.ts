import { database, DbCardData } from "mtgatool-shared";
import openExternal from "./openExternal";

export default function openScryfallCard(card?: DbCardData | number): void {
  const cardObj = typeof card == "number" ? database.card(card) : card;
  if (cardObj) {
    const { cid, set } = cardObj;
    const token = cardObj.rarity == "token" ? "t" : "";
    openExternal(
      `https://scryfall.com/card/${token}${database.sets[set].scryfall}/${cid}`
    );
  } else {
    console.error(`Cant open scryfall card: ${cardObj}`);
  }
}
