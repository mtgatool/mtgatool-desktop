/**
 * The commander survives the match-room deck path.
 *
 * That path rebuilds the deck by hand from the course rather than going
 * through convertDeckFromV3/V4, and it never copied the command zone across —
 * so a Brawl deck arriving this way was saved with 99 cards and no commander.
 * Measured in production before the fix: ~73% of DirectGameBrawl matches and
 * ~29% of Midweek Magic ones, while the events that use the normal submit path
 * were at 0 across 478 matches.
 *
 * The payload below is not invented: `"CommandZone":[{"cardId":N,"quantity":1}]`
 * is the shape Arena actually writes, confirmed against 167 occurrences in a
 * Player.log, and the field is already declared on the Course type. The bug was
 * never about the shape being unknown — it was a field that existed, was typed,
 * and was not read.
 *
 * Reproducing the failing events by hand needs a direct challenge or a live
 * Midweek Magic event, which is why the carry-over safeguards below are covered
 * here rather than by playing one.
 */
import Deck from "../../utils/mtga/deck";
import globalStore from "../store";
import { resetCurrentMatch } from "../store/currentMatchStore";

jest.mock("../../utils/cardsDb/cardsDbClient", () => ({
  __esModule: true,
  default: {
    cards: () => Promise.resolve([]),
    // Deck construction derives colours from its lands, which is a synchronous
    // card lookup; nothing here depends on the answer.
    cachedCard: () => undefined,
    cachedAbility: () => undefined,
    cachedAbilities: {},
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const handler = require("../onLabel/MatchGameRoomStateChangedEvent").default;

const COMMANDER = 83710; // a real command zone id from the log
const EVENT = "DirectGameBrawl";
const PLAYER_ID = "player-1";

/** A 99-card singleton main deck, as a Brawl course carries it. */
const MAIN = Array.from({ length: 99 }, (_, i) => ({
  cardId: 70000 + i,
  quantity: 1,
}));

function entry(courseDeck: unknown) {
  globalStore.currentCourses[EVENT] = {
    CourseDeck: courseDeck,
    CourseDeckSummary: { DeckId: "deck-a", Name: "Brawl", DeckTileId: 1 },
  } as never;

  return {
    json: {
      matchGameRoomStateChangedEvent: {
        gameRoomInfo: {
          gameRoomConfig: {
            eventId: EVENT,
            matchId: "m1",
            reservedPlayers: [
              {
                eventId: EVENT,
                playerName: "You#1",
                systemSeatId: 1,
                userId: PLAYER_ID,
              },
              {
                eventId: EVENT,
                playerName: "Them#2",
                systemSeatId: 2,
                userId: "player-2",
              },
            ],
          },
          stateType: "MatchGameRoomStateType_Playing",
        },
      },
    },
  } as never;
}

describe("match room deck selection", () => {
  beforeEach(() => {
    localStorage.setItem("playerId", PLAYER_ID);
    resetCurrentMatch();
    globalStore.currentMatch.originalDeck = new Deck();
    globalStore.currentMatch.currentDeck = new Deck();
  });

  it("reads the command zone the course carries", async () => {
    await handler(
      entry({
        MainDeck: MAIN,
        Sideboard: [],
        CommandZone: [{ cardId: COMMANDER, quantity: 1 }],
        Companions: [],
      })
    );
    expect(globalStore.currentMatch.originalDeck.getCommanders()).toEqual([
      COMMANDER,
    ]);
  });

  it("keeps partners and backgrounds, not just the first card", async () => {
    await handler(
      entry({
        MainDeck: MAIN,
        Sideboard: [],
        CommandZone: [
          { cardId: COMMANDER, quantity: 1 },
          { cardId: 81836, quantity: 1 },
        ],
        Companions: [],
      })
    );
    expect(globalStore.currentMatch.originalDeck.getCommanders()).toEqual([
      COMMANDER,
      81836,
    ]);
  });

  it("carries the commander over when the course has none", async () => {
    // The deck was already selected properly (a direct challenge you started),
    // and this path then fires with a course that omits the command zone. It
    // must not erase what is already known.
    globalStore.currentMatch.originalDeck = new Deck({
      id: "deck-a",
      mainDeck: [],
      sideboard: [],
      commandZoneGRPIds: [COMMANDER],
    } as never);

    await handler(entry({ MainDeck: MAIN, Sideboard: [] }));

    expect(globalStore.currentMatch.originalDeck.getCommanders()).toEqual([
      COMMANDER,
    ]);
  });

  it("does not carry a commander across to a different deck", async () => {
    globalStore.currentMatch.originalDeck = new Deck({
      id: "some-other-deck",
      mainDeck: [],
      sideboard: [],
      commandZoneGRPIds: [COMMANDER],
    } as never);

    await handler(entry({ MainDeck: MAIN, Sideboard: [] }));

    expect(globalStore.currentMatch.originalDeck.getCommanders()).toEqual([]);
  });
});
