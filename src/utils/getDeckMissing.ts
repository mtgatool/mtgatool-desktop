import { database, Deck, MissingWildcards } from "mtgatool-shared";
import getCardsMissingCount from "./getCardsMissinCount";

export default function getDeckMissing(deck: Deck): MissingWildcards {
  const missing = { rare: 0, common: 0, uncommon: 0, mythic: 0 };
  const alreadySeenIds = new Set(); // prevents double counting cards across main/sideboard
  const entireDeck = [
    ...deck.getMainboard().get(),
    ...deck.getSideboard().get(),
  ];

  entireDeck.forEach((card) => {
    const grpid = card.id;
    // process each card at most once
    if (alreadySeenIds.has(grpid)) {
      return;
    }
    const rarity = database.card(grpid)?.rarity;
    if (rarity && rarity !== "land" && rarity !== "token") {
      missing[rarity] += getCardsMissingCount(deck, grpid);
      alreadySeenIds.add(grpid); // remember this card
    }
  });

  return missing;
}
