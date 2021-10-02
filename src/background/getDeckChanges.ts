/* eslint-disable radix */
import { CardObject, Deck, DeckChanges, MatchGameStats } from "mtgatool-shared";

export default function getDeckChanges(
  newDeck: Deck,
  originalDeck: Deck,
  previousGamesStats?: MatchGameStats[]
): DeckChanges {
  const sideboardChanges: DeckChanges = {
    added: [],
    removed: [],
  };

  const mainDiff: { [id: number]: number } = [];
  newDeck
    .getMainboard()
    .get()
    .forEach((card: CardObject) => {
      mainDiff[card.id] = (mainDiff[card.id] || 0) + card.quantity;
    });
  originalDeck
    .getMainboard()
    .get()
    .forEach((card) => {
      mainDiff[card.id] = (mainDiff[card.id] || 0) - card.quantity;
    });

  if (previousGamesStats) {
    previousGamesStats.forEach((stats, i: number) => {
      if (i !== 0) {
        const prevChanges = stats.sideboardChanges;
        prevChanges.added.forEach((id: number) => {
          mainDiff[id] = (mainDiff[id] || 0) - 1;
        });
        prevChanges.removed.forEach((id: number) => {
          mainDiff[id] = (mainDiff[id] || 0) + 1;
        });
      }
    });
  }

  Object.keys(mainDiff).forEach((id: string) => {
    const cardId = parseInt(id);
    const quantity = mainDiff[cardId];
    for (let i = 0; i < quantity; i += 1) {
      sideboardChanges.added.push(cardId);
    }
    for (let i = 0; i > quantity; i -= 1) {
      sideboardChanges.removed.push(cardId);
    }
  });
  return sideboardChanges;
}
