import { CardObject, database, DbCardDataV2, Deck } from "mtgatool-shared";

export default function getSampleHand(deck: Deck): DbCardDataV2[] {
  const cards: DbCardDataV2[] = [];
  deck
    .getMainboard()
    .get()
    .filter((c: CardObject) => {
      return c.quantity > 0;
    })
    .forEach((c: CardObject) => {
      const card = database.card(c.id);
      if (card) {
        for (let i = 0; i < c.quantity; i += 1) {
          cards.push(card);
        }
      }
    });

  const hand: DbCardDataV2[] = [];
  if (cards.length < 7) {
    return hand;
  }
  for (let i = 0; i < 7; i += 1) {
    const index = Math.floor(Math.random() * cards.length);

    hand.push(cards[index]);
    cards.splice(index, 1);
  }
  return hand;
}
