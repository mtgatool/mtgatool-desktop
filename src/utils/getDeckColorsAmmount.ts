/* eslint-disable func-names */
import { CardObject, ColorsAmmount } from "../types";
import database from "./mtga/database";
import Deck from "./mtga/deck";

export default function getDeckColorsAmmount(deck: Deck): ColorsAmmount {
  const colors = { total: 0, w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };

  deck
    .getMainboard()
    .get()
    .forEach(function (card: CardObject) {
      if (card.quantity > 0) {
        database.card(card.id)?.ManaCost.forEach((c: string) => {
          if (c.indexOf("w") !== -1) {
            colors.w += card.quantity;
            colors.total += card.quantity;
          }
          if (c.indexOf("u") !== -1) {
            colors.u += card.quantity;
            colors.total += card.quantity;
          }
          if (c.indexOf("b") !== -1) {
            colors.b += card.quantity;
            colors.total += card.quantity;
          }
          if (c.indexOf("r") !== -1) {
            colors.r += card.quantity;
            colors.total += card.quantity;
          }
          if (c.indexOf("g") !== -1) {
            colors.g += card.quantity;
            colors.total += card.quantity;
          }
          if (c.indexOf("c") !== -1) {
            colors.c += card.quantity;
            colors.total += card.quantity;
          }
        });
      }
    });

  return colors;
}
