import { CardObject, database, Deck } from "mtgatool-shared";

interface RaritiesCount {
  c: number;
  u: number;
  r: number;
  m: number;
}

export default function getDeckRaritiesCount(deck: Deck): RaritiesCount {
  const cards = [...deck.getMainboard().get(), ...deck.getSideboard().get()];

  const rarities: string[] = [];
  cards
    .filter((c: CardObject) => {
      return c.quantity > 0;
    })
    .forEach((c: CardObject) => {
      const card = database.card(c.id);
      if (card && card.rarity !== "land" && card.rarity !== "token") {
        for (let i = 0; i < c.quantity; i += 1) {
          rarities.push(card.rarity);
        }
      }
    });

  return {
    c: rarities.filter((rarity: string | undefined) => rarity === "common")
      .length,
    u: rarities.filter((rarity: string | undefined) => rarity === "uncommon")
      .length,
    r: rarities.filter((rarity: string | undefined) => rarity === "rare")
      .length,
    m: rarities.filter((rarity: string | undefined) => rarity === "mythic")
      .length,
  };
}
