import path from "path";

import arenaLogWatcher from "../arena-log-watcher";
import logEntrySwitch from "../logEntrySwitch";
import globalStore from "../store";

jest.setTimeout(20000);

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

function replayLog() {
  return new Promise((resolve) => {
    arenaLogWatcher.start({
      path: path.join(__dirname, "test.log"),
      chunkSize: 268435440,
      onLogEntry: logEntrySwitch,
      onError: console.error,
      onFinish: resolve,
    });
  });
}

// These feed the post-match overview. Every one of them was already being
// computed except the timeline, whose accumulator existed with no call sites —
// so it silently stayed empty. That is exactly the kind of regression a replay
// catches and a type never will.
describe("post-match stats", () => {
  it("accumulates player, opponent and timeline stats from a real log", async () => {
    await replayLog();

    const { playerStats, oppStats, statsHeatMap, totalTurns } =
      globalStore.currentMatch;

    expect(totalTurns).toBeGreaterThan(0);

    // Both players took damage and paid mana over the match.
    expect(playerStats.manaUsed).toBeGreaterThan(0);
    expect(oppStats.manaUsed).toBeGreaterThan(0);
    expect(playerStats.lifeLost + oppStats.lifeLost).toBeGreaterThan(0);

    // Life totals are the "life remaining" blocks: one per life change.
    expect(playerStats.lifeTotals.length).toBeGreaterThan(0);
    expect(oppStats.lifeTotals.length).toBeGreaterThan(0);

    // Damage is keyed by the grpId that dealt it, for the DMG card.
    expect(Object.keys(playerStats.damage).length).toBeGreaterThan(0);

    // The timeline: entries for both seats, coalesced per turn and phase.
    expect(statsHeatMap.length).toBeGreaterThan(0);
    expect(new Set(statsHeatMap.map((h) => h.seat)).size).toBe(2);
    statsHeatMap.forEach((heat) => {
      expect(heat.value).toBeGreaterThan(0);
      expect(heat.phase).toBeTruthy();
    });

    // Coalescing means no two consecutive entries share seat+turn+phase.
    statsHeatMap.slice(1).forEach((heat, i) => {
      const prev = statsHeatMap[i];
      expect(
        heat.seat === prev.seat &&
          heat.turn === prev.turn &&
          heat.phase === prev.phase
      ).toBe(false);
    });
  });
});
