/* eslint-env jest */

import { cardHasType, cardType } from "../cardTypes";
import countValues from "../countValues";
import getEventPrettyName from "../getEventPrettyName";
import getSetCodeInEventId from "../getSetInEventId";
import loadDbFromCache from "../loadDbFromCache";
import CardsList from "../mtga/cardsList";
import database from "../mtga/database";
import sha1 from "../sha1";

loadDbFromCache();

describe("utils", () => {
  it("SHA1 hashes", () => {
    expect(sha1("AVeryTestfulHash!!??..0__dodo")).toBe(
      "1188e086458a6cbdc3442755f78b2f80b59f7e3b"
    );
  });

  it("Counts values", () => {
    const valA = [
      { a: true },
      { a: false },
      { a: true },
      { c: false },
      { d: true },
    ];
    expect(countValues(valA, { a: true })).toBe(2);
    const valB = [1, 2, 3, 4, 3, 6];
    expect(countValues(valB, 3)).toBe(2);
    const valC = new CardsList([
      69235, 70640, 70640, 70640, 73132, 73132, 69235, 70262, 70262, 68570,
      70262, 70390,
    ]);
    expect(
      countValues(valC.get(), {
        quantity: 3,
        id: 70640,
        measurable: true,
        chance: 0,
      })
    ).toBe(1);
  });

  it("Set codes are detected preperly", () => {
    expect(getSetCodeInEventId("Ladder")).toBeUndefined();
    expect(getSetCodeInEventId("Historic_Shakeup_20200606")).toBeUndefined();
    expect(getSetCodeInEventId("TestName_WithIkoInIt")).toBeUndefined();
    expect(getSetCodeInEventId("Sealed_DAR_20190304")).toBe("DAR");
    expect(getSetCodeInEventId("QuickDraft_GRN_20190412")).toBe("GRN");
    expect(getSetCodeInEventId("PremierDraft_IKO_20200416")).toBe("IKO");
    expect(getSetCodeInEventId("CompDraft_WAR_20190425")).toBe("WAR");
  });

  it("Card types are detected preperly", () => {
    const phSwamp = database.card(72578);
    if (phSwamp) {
      expect(cardType(phSwamp)).toBe("Land");
      expect(cardHasType(phSwamp, "basic")).toBeTruthy();
      expect(cardHasType(phSwamp, "land")).toBeTruthy();
      expect(cardHasType(phSwamp, "Land")).toBeTruthy();
    }
    const ornithopter = database.card(32951);
    if (ornithopter) {
      expect(cardType(ornithopter)).toBe("Creature");
      expect(cardHasType(ornithopter, "Artifact")).toBeTruthy();
      expect(cardHasType(ornithopter, "Creature")).toBeTruthy();
    }
  });

  it("Pretty event names are guessed properly", () => {
    expect(getEventPrettyName("Ladder")).toBe("Standard Ranked");
    expect(getEventPrettyName("Historic_Ladder")).toBe("Historic Ranked");

    expect(getEventPrettyName("PremierDraft_M21_20200625")).toBe(
      "Premier Draft M21"
    );
    expect(getEventPrettyName("QuickDraft_GRN_20190412")).toBe(
      "Quick Draft GRN"
    );
    expect(getEventPrettyName("CompDraft_WAR_20190425")).toBe(
      "Competitive Draft WAR"
    );
    expect(getEventPrettyName("Historic_Shakeup_20200606")).toBe(
      "Historic Shakeup (June 2020)"
    );
    expect(getEventPrettyName("Play_Brawl")).toBe("Brawl");
    expect(getEventPrettyName("Constructed_Event_2020")).toBe(
      "Standard Event 2020"
    );
    expect(getEventPrettyName("Traditional_Cons_Event_2020")).toBe(
      "Traditional Standard Event 2020"
    );

    expect(getEventPrettyName("Pauper_20190315")).toBe("Pauper (March 2019)");
  });
});
