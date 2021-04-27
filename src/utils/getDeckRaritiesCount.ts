import { CardObject, database, Deck } from "mtgatool-shared";

interface RaritiesCount {
  c: number;
  u: number;
  r: number;
  m: number;
}

export default function getDeckRaritiesCount(deck: Deck): RaritiesCount {
  const cards = [...deck.getMainboard().get(), ...deck.getSideboard().get()];
  const rarities = cards
    .filter((c: CardObject) => {
      return c.quantity > 0;
    })
    .map((c: CardObject) => {
      const card = database.card(c.id);
      return card?.rarity;
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
