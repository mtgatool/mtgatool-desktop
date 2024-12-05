/* eslint-env jest */
import _ from "lodash";

import { cardType } from "../cardTypes";
import loadDbFromCache from "../loadDbFromCache";
import database from "../mtga/database";

loadDbFromCache();

const cardsByName = _.keyBy(database.cards, "Name");

describe("card-types", () => {
  describe("cardType", () => {
    it("determines a card's card type", () => {
      expect(cardType(cardsByName.Gravewaker)).toEqual("Creature");
      expect(cardType(cardsByName["Vivien Reid"])).toEqual("Planeswalker");
      expect(cardType(cardsByName["Settle the Wreckage"])).toEqual("Instant");
      expect(cardType(cardsByName["Toll of the Invasion"])).toEqual("Sorcery");
      expect(cardType(cardsByName["God-Pharaoh's Statue"])).toEqual("Artifact");
      expect(cardType(cardsByName["Curious Obsession"])).toEqual("Enchantment");
      expect(cardType(cardsByName["Breeding Pool"])).toEqual("Land");
      expect(cardType(cardsByName["Tomb of Annihilation"])).toEqual("Dungeon");
    });

    it("determines Artifact Creatures to be Creatures", () => {
      expect(cardType(cardsByName["Iron Bully"])).toEqual("Creature");
    });

    it("can determine the card type of any card except City's Blessing", () => {
      database.cardList.forEach((card) => {
        if (!_.has(card, "name")) return; // some properties are not cards :(
        if (card.Name === "City's Blessing") return; // has no type
        if (card.GrpId === 100) return; // has invalid type
        if (card.GrpId === 79412) return; // Day
        if (card.GrpId === 79413) return; // Night
        try {
          cardType(card);
        } catch (e) {
          console.log(card, e);
        }
        const act = () => cardType(card);
        expect(act).not.toThrow();
      });
    });
  });
});
