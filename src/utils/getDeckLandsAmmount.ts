/* eslint-disable func-names */
import { CardObject, ColorsAmmount } from "../types";
import database from "./mtga/database";
import Deck from "./mtga/deck";

export default function getDeckLandsAmmount(deck: Deck): ColorsAmmount {
  const colors = { total: 0, w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };

  deck
    .getMainboard()
    .get()
    .forEach(function (cobj: CardObject) {
      const { quantity } = cobj;
      const card = database.card(cobj.id);
      if (quantity > 0 && card) {
        if (
          card.Types.indexOf("Land") != -1 ||
          card.Types.indexOf("land") != -1
        ) {
          // Color identity, not frame colors. A fetchland's frame carries the
          // colors it can *fetch* — Scalding Tarn reads as blue-red — so a
          // fetch base counted as mana it cannot make, and the sources pie
          // showed colors the deck could not produce. Its color identity is
          // empty, which is what a land producing no mana should contribute.
          if (card.ColorIdentity.length < 5) {
            card.ColorIdentity.forEach(function (c: number) {
              if (c == 1) {
                colors.w += quantity;
                colors.total += quantity;
              }
              if (c == 2) {
                colors.u += quantity;
                colors.total += quantity;
              }
              if (c == 3) {
                colors.b += quantity;
                colors.total += quantity;
              }
              if (c == 4) {
                colors.r += quantity;
                colors.total += quantity;
              }
              if (c == 5) {
                colors.g += quantity;
                colors.total += quantity;
              }
              if (c == 6) {
                colors.c += quantity;
                colors.total += quantity;
              }
            });
          }
        }
      }
    });

  return colors;
}
