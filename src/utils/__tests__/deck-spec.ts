/* eslint-env jest */

import loadDbFromCache from "../loadDbFromCache";
import Deck from "../mtga/deck";

loadDbFromCache();

describe("deck", () => {
  describe("constructor", () => {});

  describe("sort", () => {});

  describe("clone", () => {});

  describe("hashing", () => {
    it("returns proper hash", () => {
      const mainA = [
        69235, 70640, 70640, 70640, 73132, 73132, 69235, 70262, 70262, 68570,
        70262, 70390,
      ];
      const mainB = [
        73132, 69235, 70262, 70262, 69235, 70640, 70640, 70262, 70640, 73132,
        70390,
      ];
      const side = [68576, 70267, 70267, 68576, 68576];
      const hashTestA = new Deck({}, mainA, side);
      const hashTestB = new Deck({}, side, mainB);
      hashTestB.getMainboard().add(68570, 1, true);

      // These test could fail if database-spec fails
      expect(hashTestA.getUniqueString(true)).toBe(
        "70640,3,70262,3,68570,1,69235,2,70390,1,73132,2,"
      );
      expect(hashTestA.getHash(true)).toBe(
        "866e1513b4ffcdb03e3c9d1b8dab8f9fdabe187c"
      );
      expect(hashTestB.getHash(true)).toBe(
        "a6a5d6abfce9fc0075125e6ca78aeb7d3a902ed6"
      );
    });
  });
});
