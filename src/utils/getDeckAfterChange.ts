import { DeckChange } from "../types";
import Deck from "./mtga/deck";

export default function getDeckAfterChange(change: DeckChange): Deck {
  const decklist = new Deck({}, change.previousMain, change.previousSide);
  // Calculate new deck hash based on the changes
  change.changesMain.forEach((ch) => {
    const q = parseInt(`${ch.quantity}`, 10) || 0;
    if (q < 0) {
      decklist.getMainboard().remove(ch.id, Math.abs(q));
    } else {
      decklist.getMainboard().add(ch.id, q);
    }
  });
  change.changesSide.forEach((ch) => {
    const q = parseInt(`${ch.quantity}`, 10) || 0;
    if (q < 0) {
      decklist.getSideboard().remove(ch.id, Math.abs(q));
    } else {
      decklist.getSideboard().add(ch.id, q);
    }
  });
  decklist.getMainboard().removeZeros(true);
  decklist.getMainboard().removeDuplicates(true);
  decklist.getSideboard().removeZeros(true);
  decklist.getSideboard().removeDuplicates(true);
  return decklist;
}
