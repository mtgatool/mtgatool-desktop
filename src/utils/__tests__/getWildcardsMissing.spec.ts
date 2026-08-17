/**
 * Wildcards missing for a card whose playset is held on a different printing.
 *
 * Arena counts copies across every printing, so a deck listing the printing
 * you own one of is fully covered by four of another. This reported "missing
 * 3" for exactly that case: the reprint list it reads was being dropped when
 * cards were loaded, so it only ever counted the deck's own printing.
 *
 * The numbers are the real ones from that report — Fatal Push, four printings
 * under title 462, a playset held on KLR and a single copy of the FCA one.
 */
import Deck from "../mtga/deck";

const KLR_OWNED = 75662;
const FCA_IN_DECK = 96238;
const KLR_OTHER = 75921;
const SLD = 79887;

const mockReprints: Record<number, number[]> = {
  [KLR_OWNED]: [KLR_OTHER, SLD, FCA_IN_DECK],
  [FCA_IN_DECK]: [KLR_OWNED, KLR_OTHER, SLD],
};

/** What the collection holds, per printing. */
let mockOwned: Record<number, number> = {};

jest.mock("../mtga/database", () => ({
  __esModule: true,
  default: {
    card: (grpId: number) => ({
      GrpId: grpId,
      TitleId: 462,
      Name: "Fatal Push",
      Rarity: "uncommon",
      Types: "Instant",
      Supertypes: "",
      Reprints: mockReprints[grpId] ?? [],
    }),
  },
}));

jest.mock("../../redux/stores/rendererStore", () => ({
  __esModule: true,
  default: {
    getState: () => ({
      mainData: {
        currentUUID: "u",
        uuidData: { u: { cards: { cards: mockOwned, prevCards: {} } } },
      },
    }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const getWildcardsMissing = require("../getWildcardsMissing").default;

function deckWith(grpId: number, quantity: number): Deck {
  return new Deck({}, [{ id: grpId, quantity }], []);
}

describe("getWildcardsMissing", () => {
  afterEach(() => {
    mockOwned = {};
  });

  it("counts a playset held on another printing", () => {
    mockOwned = { [KLR_OWNED]: 4, [FCA_IN_DECK]: 1 };
    expect(getWildcardsMissing(deckWith(FCA_IN_DECK, 4), FCA_IN_DECK)).toBe(0);
  });

  it("still reports what is genuinely missing", () => {
    // One copy in total, across every printing.
    mockOwned = { [FCA_IN_DECK]: 1 };
    expect(getWildcardsMissing(deckWith(FCA_IN_DECK, 4), FCA_IN_DECK)).toBe(3);
  });

  it("adds up partial holdings spread over printings", () => {
    mockOwned = { [KLR_OWNED]: 2, [KLR_OTHER]: 1, [FCA_IN_DECK]: 0 };
    expect(getWildcardsMissing(deckWith(FCA_IN_DECK, 4), FCA_IN_DECK)).toBe(1);
  });

  it("owns nothing, needs the whole playset", () => {
    expect(getWildcardsMissing(deckWith(FCA_IN_DECK, 4), FCA_IN_DECK)).toBe(4);
  });
});
