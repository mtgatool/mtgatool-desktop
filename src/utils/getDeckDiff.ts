/* eslint-disable radix */
import { CardObject, CardsList, Deck } from "mtgatool-shared";

export interface DeckDiff {
  added: CardsList;
  removed: CardsList;
}

export default function getDeckDiff(
  newDeck: Deck,
  originalDeck: Deck
): DeckDiff {
  const addedDiff = new CardsList([]);
  const removedDiff = new CardsList([]);

  originalDeck
    .getMainboard()
    .get()
    .forEach((card) => {
      removedDiff.add(card.id, card.quantity);
    });
  originalDeck
    .getSideboard()
    .get()
    .forEach((card) => {
      removedDiff.add(card.id, card.quantity);
    });

  newDeck
    .getMainboard()
    .get()
    .forEach((card: CardObject) => {
      addedDiff.add(card.id, card.quantity);
      removedDiff.remove(card.id, card.quantity);
    });
  newDeck
    .getSideboard()
    .get()
    .forEach((card: CardObject) => {
      addedDiff.add(card.id, card.quantity);
      removedDiff.remove(card.id, card.quantity);
    });

  originalDeck
    .getMainboard()
    .get()
    .forEach((card) => {
      addedDiff.remove(card.id, card.quantity);
    });
  originalDeck
    .getSideboard()
    .get()
    .forEach((card) => {
      addedDiff.remove(card.id, card.quantity);
    });

  addedDiff.removeDuplicates();
  addedDiff.removeZeros();
  removedDiff.removeDuplicates();
  removedDiff.removeZeros();

  return {
    added: addedDiff,
    removed: removedDiff,
  };
}
