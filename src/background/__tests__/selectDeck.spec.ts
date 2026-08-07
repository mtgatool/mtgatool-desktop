import cardsDb from "../../utils/cardsDb/cardsDbClient";
import Deck from "../../utils/mtga/deck";
import selectDeck from "../selectDeck";
import globalStore from "../store";

/**
 * The draw odds are computed in this window by plain code — no component — and
 * `database.card()` only returns cards that have already been fetched. So
 * nothing else will ever ask for the deck's cards on its behalf, and if
 * selectDeck does not, every lookup behind the odds returns undefined: the deck
 * reads as having no lands, creatures or spells, and the overlay's land
 * breakdown has nothing to show.
 */
describe("selectDeck", () => {
  const deck = new Deck(
    undefined,
    [
      { id: 68310, quantity: 4 },
      { id: 68311, quantity: 3 },
    ],
    [{ id: 68312, quantity: 2 }]
  );

  /** Nothing here should reach the worker; we only care what was asked for. */
  function spyOnCards(): jest.SpyInstance {
    return jest.spyOn(cardsDb, "cards").mockResolvedValue([]);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks for the cards the odds will be read from", () => {
    const cards = spyOnCards();

    selectDeck(deck);

    expect(cards).toHaveBeenCalledTimes(1);
    // Mainboard and sideboard both: a card swapped in between games is read the
    // same way as one that started in the deck.
    const asked = [...(cards.mock.calls[0][0] as number[])].sort();
    expect(asked).toEqual([68310, 68311, 68312]);
  });

  it("keeps the deck it was given", () => {
    spyOnCards();

    selectDeck(deck);

    expect(globalStore.currentMatch.currentDeck.getMainboard().count()).toBe(7);
    expect(globalStore.currentMatch.originalDeck.getMainboard().count()).toBe(
      7
    );
  });

  it("does not ask for anything when the deck is empty", () => {
    const cards = spyOnCards();

    selectDeck(new Deck());

    expect(cards).not.toHaveBeenCalled();
  });
});
