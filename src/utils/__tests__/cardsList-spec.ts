import CardsList from "../mtga/cardsList";
import testSeedDatabase from "../testSeedDatabase";

testSeedDatabase();

/**
 * Ids the card database does not contain, standing in for cards that simply
 * have not been fetched yet — which, with an on-demand cache, is every card
 * until something asks for it.
 */
const UNKNOWN_A = 999999991;
const UNKNOWN_B = 999999992;

describe("CardsList.removeDuplicates", () => {
  it("merges two copies of the same card", () => {
    const list = new CardsList([
      { id: 66116, quantity: 2, measurable: true, chance: 0 },
      { id: 66116, quantity: 2, measurable: true, chance: 0 },
    ]);
    const merged = list.removeDuplicates(false);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(4);
  });

  it("keeps different cards apart", () => {
    const list = new CardsList([
      { id: 66116, quantity: 2, measurable: true, chance: 0 },
      { id: 66091, quantity: 3, measurable: true, chance: 0 },
    ]);
    expect(list.removeDuplicates(false)).toHaveLength(2);
  });

  /**
   * The regression this exists for.
   *
   * Merging compared `db.card(a)?.Name === db.card(b)?.Name`. Neither card
   * being loaded made that `undefined === undefined`, so the first entry
   * matched every other one and an entire deck collapsed into a single card
   * holding the summed quantity — destructively, since replaceList defaults to
   * true, so the other ids were gone before anything could fetch them.
   *
   * In a live match that turned a 52-card library into one entry of 52.
   */
  it("does not merge distinct cards it cannot resolve", () => {
    const list = new CardsList([
      { id: UNKNOWN_A, quantity: 4, measurable: true, chance: 0 },
      { id: UNKNOWN_B, quantity: 3, measurable: true, chance: 0 },
    ]);

    const merged = list.removeDuplicates(false);

    expect(merged).toHaveLength(2);
    expect(merged.map((c) => c.id).sort()).toEqual([UNKNOWN_A, UNKNOWN_B]);
    expect(merged.map((c) => c.quantity)).toEqual([4, 3]);
  });

  it("still merges the same unresolved card with itself", () => {
    const list = new CardsList([
      { id: UNKNOWN_A, quantity: 4, measurable: true, chance: 0 },
      { id: UNKNOWN_A, quantity: 2, measurable: true, chance: 0 },
    ]);

    const merged = list.removeDuplicates(false);

    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(6);
  });

  it("does not collapse a whole unresolved decklist", () => {
    const list = new CardsList(
      Array.from({ length: 15 }, (_v, i) => ({
        id: 999990000 + i,
        quantity: 4,
        measurable: true,
        chance: 0,
      }))
    );

    expect(list.removeDuplicates(false)).toHaveLength(15);
  });
});
