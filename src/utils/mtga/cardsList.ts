/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
import _ from "lodash";

import {
  anyCardsList,
  CardObject,
  isV2CardsList,
  v2cardsList,
} from "../../types/deck";
import Colors from "./colors";
import db from "./database";

interface CardTypesCount {
  art: number;
  cre: number;
  enc: number;
  ins: number;
  lan: number;
  pla: number;
  sor: number;
}

interface ColorsCount {
  total: number;
  w: number;
  u: number;
  b: number;
  r: number;
  g: number;
  c: number;
}

class CardsList {
  /**
   * Creates a list of cards based on an array of objects with the form
   * {quantity, id}
   * If an array of IDs is given it sets each quantity to the number of adjacent
   * repetitions
   */
  private list: v2cardsList;

  constructor(newList: anyCardsList) {
    this.list = [];
    if (isV2CardsList(newList)) {
      this.list = newList.map((obj: CardObject) => {
        return {
          ...obj,
          measurable: true,
        };
      });
    } else {
      newList.forEach((id) => {
        this.list.push({ quantity: 1, id: id, measurable: true, chance: 0 });
      });
      this.removeDuplicates(true);
    }
  }

  get(): v2cardsList {
    return this.list;
  }

  /**
   * Adds a card to the list
   * */
  add(grpId: number, quantity = 1, merge = false): CardObject {
    if (typeof quantity !== "number") {
      throw new Error("quantity must be a number");
    }
    if (merge) {
      for (let index = 0; index < this.list.length; index += 1) {
        const card = this.list[index];
        if (card.id == grpId) {
          card.quantity += quantity;
          return card;
        }
      }
    }

    this.list.push({
      quantity: quantity,
      id: grpId,
      measurable: true,
      chance: 0,
    });
    return this.list[this.list.length - 1];
  }

  /**
   * Removes a card from the list.
   * */
  remove(grpId: number, quantity = 1, byName = false): void {
    if (byName) {
      const cardToFind = db.card(grpId);
      this.list.forEach(function (card) {
        const cardInList = db.card(card.id);
        if (cardToFind?.Name === cardInList?.Name) {
          const remove = Math.min(card.quantity, quantity);
          card.quantity -= remove;
          quantity -= remove;
        }
      });
    } else {
      this.list.forEach(function (card) {
        if (grpId == card.id) {
          const remove = Math.min(card.quantity, quantity);
          card.quantity -= remove;
          quantity -= remove;
        }
      });
    }
  }

  /**
   * Counts all cards in the list, if provided it only counts
   * for the given propierty.
   * */
  count(prop = "quantity"): number {
    return _.sumBy(this.list, prop);
  }

  /**
   * Same as count(), but here we can apply a filter function to the list.
   * */
  countFilter(prop = "quantity", func: (c: CardObject) => boolean): number {
    return _(this.list).filter(func).sumBy(prop);
  }

  /**
   * Creates a n object containing how many of each type the list has
   * */
  countTypesAll(): CardTypesCount {
    const types = { art: 0, cre: 0, enc: 0, ins: 0, lan: 0, pla: 0, sor: 0 };

    this.list.forEach(function (card) {
      const c = db.card(card.id);
      if (c !== undefined) {
        if (c.Types.includes("Land", 0))
          types.lan += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Creature", 0))
          types.cre += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Artifact", 0))
          types.art += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Enchantment", 0))
          types.enc += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Instant", 0))
          types.ins += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Sorcery", 0))
          types.sor += card.measurable ? card.quantity : 1;
        else if (c.Types.includes("Planeswalker", 0))
          types.pla += card.measurable ? card.quantity : 1;
      }
    });

    return types;
  }

  /**
   * Counts how many cards of a given type the list has.
   * */
  countType(type: string): number {
    const types = this.countTypesAll();
    if (type.includes("Land", 0)) return types.lan;
    if (type.includes("Creature", 0)) return types.cre;
    if (type.includes("Artifact", 0)) return types.art;
    if (type.includes("Enchantment", 0)) return types.enc;
    if (type.includes("Instant", 0)) return types.ins;
    if (type.includes("Sorcery", 0)) return types.sor;
    if (type.includes("Planeswalker", 0)) return types.pla;

    return 0;
  }

  /**
   * Creates an object containing the colors distribution of the list.
   * */
  getColorsAmounts(): ColorsCount {
    const colors = { total: 0, w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };

    this.list.forEach(function (card) {
      if (card.quantity > 0) {
        const dbCard = db.card(card.id);
        if (dbCard !== undefined) {
          dbCard.ManaCost.forEach(function (c: string) {
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
      }
    });

    return colors;
  }

  /**
   * Creates an object containing the lands color distribution of the list.
   *
   * Reads `FrameColors`, and deliberately not `ColorIdentity` — which looks
   * like the more principled field and is the wrong one here. Identity answers
   * "which colors is this card legal in", so a land's activated-ability cost
   * counts toward it: Riptide Laboratory reads as blue and Duskmantle as
   * blue/black, when both only tap for colorless. It is also empty for
   * fetchlands, which have no mana symbols at all — dropping every fetch out of
   * the counts, when a Scalding Tarn in a deck is exactly as good as the dual
   * it fetches. Across the card pool the two disagree on 203 lands, and the
   * swap would lose about twenty for each one it gained.
   *
   * True produced mana does exist, in the `Add {X}` ability text, and is right
   * where both these fields are wrong. It is not used because it would also
   * stop counting fetchlands (not wanted) and needs hybrid and conditional
   * mana parsed to be any better than the frame on everything else.
   *
   * The five-color skip below is load-bearing: without it every land that taps
   * for any color — Mana Confluence, City of Brass, and 100-odd others — lands
   * in all five buckets and flattens the distribution.
   * */
  getLandsAmounts(): ColorsCount {
    const colors = { total: 0, w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 };

    this.list.forEach(function (cardEntry) {
      const { quantity } = cardEntry;
      const card = db.card(cardEntry.id);
      if (card !== undefined && quantity > 0) {
        if (
          card.Types.indexOf("Land") != -1 ||
          card.Types.indexOf("land") != -1
        ) {
          if (card.FrameColors.length < 5) {
            card.FrameColors.forEach(function (c: number) {
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

  /**
   * Inserts a chance property to each card in the list.
   * */
  addChance(fn: (item: CardObject) => number): void {
    this.list.forEach((card) => {
      card.chance = fn(card);
    });
  }

  /**
   * Get all colors in the list as a Colors object.
   * */
  getColors(): Colors {
    const colors = new Colors();
    this.list.forEach((card) => {
      const cardData = db.card(card.id);
      if (cardData !== undefined) {
        const isLand = cardData.Types.indexOf("Land") !== -1;
        if (isLand && cardData.FrameColors.length < 3) {
          colors.addFromArray(cardData.FrameColors);
        }
        colors.addFromCost(cardData.ManaCost);
      }
    });

    return colors;
  }

  /**
   * Removes all duplicate cards and merges them.
   * If ReplaceList is set, replaces the _list with the new one.
   * Returns the new list (not a cardsList object)
   * */
  removeDuplicates(replaceList = true): v2cardsList {
    const newList: v2cardsList = [];

    this.list.forEach(function (card) {
      const cardObj = db.card(card.id);
      const found = newList.find((c: CardObject) => {
        // The same printing always merges, whether or not it is loaded.
        if (c.id === card.id) return true;
        const dbCard = db.card(c.id);
        // Merging different printings needs both names, and needs them to be
        // known. A card lookup only returns what has already been fetched, so
        // before that every name is undefined — and `undefined === undefined`
        // made the first entry match every other one, collapsing a whole deck
        // into a single card. Destructively: replaceList defaults to true, so
        // the other ids were gone before anything could fetch them, and no
        // later render could recover the list.
        return !!dbCard && !!cardObj && dbCard.Name === cardObj.Name;
      });
      if (found) {
        if (found.measurable) {
          found.quantity += card.quantity;
        }
      } else {
        newList.push(card);
      }
    });

    if (replaceList) {
      this.list = newList;
    }

    return newList;
  }

  /**
   * Removes all cards that have zero or less than zero quantity.
   * If ReplaceList is set, replaces the _list with the new one.
   * Returns the new list (not a cardsList object)
   * */
  removeZeros(replaceList = true): v2cardsList {
    const newList: v2cardsList = [];

    this.list.forEach((card) => {
      if (card.quantity > 0) {
        newList.push(card);
      }
    });

    if (replaceList) {
      this.list = newList;
    }

    return newList;
  }
}

export default CardsList;
