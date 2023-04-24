import { CardObject, database, Deck } from "mtgatool-shared";

export default function getDeckTypesAmount(deck: Deck): {
  [key: string]: number;
} {
  const types = {
    art: 0,
    cre: 0,
    enc: 0,
    ins: 0,
    lan: 0,
    pla: 0,
    sor: 0,
    bat: 0,
  };
  if (!deck.getMainboard().get()) return types;

  deck
    .getMainboard()
    .get()
    .forEach((card: CardObject | any) => {
      // TODO remove group lands hack
      if (card?.id?.id === 100) {
        return;
      }
      const c = database.card(card.id);
      if (c) {
        if (c.Types.includes("Land", 0)) types.lan += card.quantity;
        if (c.Types.includes("Creature", 0)) types.cre += card.quantity;
        if (c.Types.includes("Artifact", 0)) types.art += card.quantity;
        if (c.Types.includes("Enchantment", 0)) types.enc += card.quantity;
        if (c.Types.includes("Battle", 0)) types.bat += card.quantity;
        if (c.Types.includes("Instant", 0)) types.ins += card.quantity;
        if (c.Types.includes("Sorcery", 0)) types.sor += card.quantity;
        if (c.Types.includes("Planeswalker", 0)) types.pla += card.quantity;
      }
    });

  return types;
}
