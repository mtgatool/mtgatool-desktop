import globalStore from "../store";
import {
  createMatchState,
  resetCurrentMatch,
} from "../store/currentMatchStore";

/**
 * The store's default state used to be a single object that
 * `globalStore.currentMatch` was initialised *to* rather than from. Every
 * setter writes through that reference, so a match running before the first
 * resetCurrentMatch wrote into the defaults themselves — and resetCurrentMatch
 * then spread those mutated defaults as the starting point for every match
 * after it.
 *
 * It took an app start or reload *during* a game to trigger, because normally
 * the first MatchGameRoomStateType_Playing resets before any GRE traffic and
 * decouples the defaults while they are still clean. When it did trigger, an
 * opponent's cards from a match already finished turned up in the next match's
 * deck list, and msgId never returned to 0 — which is how a new match is
 * recognised, so that broke too.
 */
describe("current match state", () => {
  it("hands out a new object every time", () => {
    const a = createMatchState();
    const b = createMatchState();
    expect(a).not.toBe(b);
    // Nested state has to be fresh as well, or clearing one match's zones or
    // seen cards would clear another's.
    expect(a.opponent).not.toBe(b.opponent);
    expect(a.playerStats).not.toBe(b.playerStats);
    expect(a.zones).not.toBe(b.zones);
    expect(a.handsDrawn).not.toBe(b.handsDrawn);
  });

  it("does not let a match write into the defaults", () => {
    globalStore.currentMatch.msgId = 289;
    globalStore.currentMatch.opponent.name = "Dzees";
    globalStore.currentMatch.opponent.cardsUsed = [1, 2, 3];
    globalStore.currentMatch.handsDrawn = [[4, 5, 6]];

    resetCurrentMatch();

    expect(globalStore.currentMatch.msgId).toBe(0);
    expect(globalStore.currentMatch.opponent.name).toBeUndefined();
    expect(globalStore.currentMatch.opponent.cardsUsed).toBeUndefined();
    expect(globalStore.currentMatch.handsDrawn).toEqual([]);
  });

  it("stays clean across repeated matches", () => {
    // The original fault only showed from the second match onwards, so one
    // reset is not enough to prove anything.
    for (let i = 0; i < 3; i += 1) {
      globalStore.currentMatch.msgId = 100 + i;
      globalStore.currentMatch.opponent.cardsUsed = [i];
      resetCurrentMatch();
      expect(globalStore.currentMatch.msgId).toBe(0);
      expect(globalStore.currentMatch.opponent.cardsUsed).toBeUndefined();
    }
  });

  it("keeps the deck chosen before the match started", () => {
    const deck = globalStore.currentMatch.currentDeck;
    resetCurrentMatch();
    expect(globalStore.currentMatch.currentDeck).toBe(deck);
  });
});
