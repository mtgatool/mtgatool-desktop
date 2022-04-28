import { database, DbCardData } from "mtgatool-shared";
import openExternal from "./openExternal";

function findSetByCode(code: string) {
  const name = Object.keys(database.sets).filter((k: string) => {
    return database.sets[k].arenacode.toLowerCase() === code.toLowerCase();
  })[0];

  return name ? database.sets[name] : undefined;
}

export default function openScryfallCard(card?: DbCardData | number): void {
  const cardObj = typeof card == "number" ? database.card(card) : card;
  if (cardObj) {
    const { cid, set } = cardObj;
    const token = cardObj.rarity == "token" ? "t" : "";

    const setObj = findSetByCode(set);

    if (setObj) {
      openExternal(
        `https://scryfall.com/card/${token}${setObj.scryfall}/${cid}`
      );
    }
  } else {
    console.error(`Cant open scryfall card: ${cardObj}`);
  }
}
