/**
 * Opening the tracker while a game is running, end to end: the scan picks a
 * start offset, the watcher reads from there, and the match that finishes
 * afterwards is a real record rather than the 0-0 husk with no decklists that
 * joining halfway produces.
 *
 * The fixture is a real log spanning the previous match's end, this match's
 * start and its completion. The test cuts it in half to stand in for the log as
 * it looked the moment the tracker opened, then appends the rest so the match
 * plays out — which is also what exercises the watcher's ordinary tailing.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const arenaLogWatcher = require("../arena-log-watcher").default;
const findInProgressMatch = require("../findInProgressMatch").default;
const logEntrySwitch = require("../logEntrySwitch").default;
const globalStore = require("../store").default;
const backGlobalData = require("../../utils/backGlobalData").default;
const seedDatabase = require("../../utils/testSeedDatabase").default;

jest.setTimeout(60000);

const PLAYER_ID = "BA263BD3A7D57B48";
// Inside the match: after it starts (line 1643), before it ends (line 6415).
const CUT = 4000;

function fixtureLines() {
  return zlib
    .gunzipSync(fs.readFileSync(path.join(__dirname, "midMatchJoin.log.gz")))
    .toString("utf8")
    .split("\n");
}

/** Replay the second half of the log, a chunk at a time, as the game plays it. */
async function playOut(file, rest) {
  fs.appendFileSync(file, rest);
  // fsWatch polls on a timer; give it room to notice and drain.
  await new Promise((resolve) => setTimeout(resolve, 2500));
}

describe("joining a match already in progress", () => {
  let completed;
  let startedAt;

  beforeAll(async () => {
    backGlobalData.localSettingsProxy.playerId = PLAYER_ID;
    seedDatabase();

    const lines = fixtureLines();
    const file = path.join(os.tmpdir(), "mtgatool-midmatch.log");
    fs.writeFileSync(file, `${lines.slice(0, CUT).join("\n")}\n`);

    // What the tracker would work out at startup, from the raw text alone.
    startedAt = findInProgressMatch(file);

    completed = [];
    const quiet = ["log", "warn", "info"].map((k) => {
      const original = console[k];
      console[k] = () => undefined;
      return () => {
        console[k] = original;
      };
    });

    const stop = arenaLogWatcher.start({
      path: file,
      chunkSize: 268435440,
      skipInitialBackfill: true,
      initialPosition: startedAt === null ? undefined : startedAt,
      onLogEntry: (entry) => {
        logEntrySwitch(entry);
        const room = entry.json?.matchGameRoomStateChangedEvent?.gameRoomInfo;
        if (room?.stateType === "MatchGameRoomStateType_MatchCompleted") {
          const match = globalStore.currentMatch;
          completed.push({
            opponent: match.opponent?.name,
            playerSeat: match.playerSeat,
            oppSeat: match.oppSeat,
            deckName: match.currentDeck?.getName(),
            deckCards: match.currentDeck?.getMainboard().count(),
            games: JSON.parse(JSON.stringify(match.matchGameStats)),
            results: (match.gameInfo?.results || []).map(
              (r) => `${r.scope}:${r.winningTeamId}`
            ),
          });
        }
      },
      onError: () => undefined,
      onFinish: () => undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    await playOut(file, `${lines.slice(CUT).join("\n")}\n`);

    stop();
    quiet.forEach((restore) => restore());
    fs.unlinkSync(file);
  });

  it("rewinds to before the match started", () => {
    // Not null: a match *is* in progress at the cut.
    expect(startedAt).not.toBeNull();
    expect(startedAt).toBeGreaterThan(0);
  });

  it("records the match once, not the one before it", () => {
    expect(completed).toHaveLength(1);
  });

  it("knows who was playing", () => {
    // Seats stay at 0 when the match-start entry is missed, which is what
    // joining halfway does.
    expect(completed[0].opponent).toBe("acmtg");
    expect(completed[0].playerSeat).toBe(2);
    expect(completed[0].oppSeat).toBe(1);
  });

  it("has the decklist, which is submitted before the match starts", () => {
    expect(completed[0].deckName).toBe("Sneak & Show");
    expect(completed[0].deckCards).toBe(60);
  });

  it("has the result and the game data", () => {
    expect(completed[0].results).toContain("MatchScope_Match:1");
    expect(completed[0].games).toHaveLength(1);
    expect(completed[0].games[0].handsDrawn.length).toBeGreaterThan(0);
    expect(completed[0].games[0].cardsCast.length).toBeGreaterThan(0);
  });
});
