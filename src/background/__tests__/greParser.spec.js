/**
 * Real matches replayed through the whole pipeline — arena-log-watcher, the
 * decoder, logEntrySwitch and the GRE interpreter.
 *
 * Every fixture here spans more than one game or match on purpose, and trimming
 * one down to the part that misbehaves would defeat it. The faults these cover
 * did not come from mis-parsing the bytes in front of the parser; they came
 * from state left over by the game or match *before*, which a single-match
 * fixture can never reproduce because it always starts from a clean store.
 *
 * Expected values are not hand-computed. They are what the app recorded for the
 * games that parsed correctly, and for the ones that did not, what the fix
 * produces — each cross-checked against the live console trace (the parser logs
 * `Mulligan: <n>, <ids>` as it reads each opening hand).
 *
 * Fixtures are gzipped: ~15x smaller, and the log watcher only needs a path, so
 * unpacking to a temp file costs nothing.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const arenaLogWatcher = require("../arena-log-watcher").default;
const logEntrySwitch = require("../logEntrySwitch").default;
const globalStore = require("../store").default;
const backGlobalData = require("../../utils/backGlobalData").default;

jest.setTimeout(60000);

// Which seat is "us" is resolved by matching this against the room's reserved
// players; without it no match can tell whose opening hand it is.
const PLAYER_ID = "BA263BD3A7D57B48";

/**
 * Replay a fixture and return one entry per completed match, in order.
 *
 * currentMatch is recycled, so each match's stats are taken while they are
 * still the current ones rather than read at the end.
 */
function replay(fixture) {
  backGlobalData.localSettingsProxy.playerId = PLAYER_ID;

  const logPath = path.join(os.tmpdir(), `mtgatool-${fixture}`);
  fs.writeFileSync(
    logPath,
    zlib.gunzipSync(fs.readFileSync(path.join(__dirname, `${fixture}.gz`)))
  );

  const completed = [];
  const errors = [];
  const quiet = ["log", "warn", "info"].map((k) => {
    const original = console[k];
    console[k] = () => undefined;
    return () => {
      console[k] = original;
    };
  });

  return new Promise((resolve) => {
    arenaLogWatcher.start({
      path: logPath,
      chunkSize: 268435440,
      onLogEntry: (entry) => {
        logEntrySwitch(entry);
        const room = entry.json?.matchGameRoomStateChangedEvent?.gameRoomInfo;
        if (room?.stateType === "MatchGameRoomStateType_MatchCompleted") {
          const match = globalStore.currentMatch;
          completed.push({
            opponent: match.opponent?.name,
            player: match.player?.name,
            playerSeat: match.playerSeat,
            oppSeat: match.oppSeat,
            results: JSON.parse(JSON.stringify(match.gameInfo.results || [])),
            games: JSON.parse(JSON.stringify(match.matchGameStats)),
          });
        }
      },
      onError: (err) => errors.push(err),
      onFinish: () => {
        quiet.forEach((restore) => restore());
        fs.unlinkSync(logPath);
        resolve({ completed, errors });
      },
    });
  });
}

describe("two consecutive matches", () => {
  let matches;
  let errors;

  beforeAll(async () => {
    ({ completed: matches, errors } = await replay("greMatchBoundary.log"));
  });

  it("parses both matches", () => {
    expect(errors).toEqual([]);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toHaveProperty("games.length", 1);
    expect(matches[1]).toHaveProperty("games.length", 1);
  });

  it("reads the first match the way the app recorded it", () => {
    const game = matches[0].games[0];
    expect(game.handsDrawn).toEqual([
      [77492, 95114, 51281, 68738, 94869, 83896, 68738],
    ]);
    expect(game.cardsCast).toHaveLength(7);
    expect(game.cardsSeen).toHaveLength(10);
    expect(game.time).toBe(173);
    expect(game.winner).toBe(1);
  });

  it("still reads the opening hand of the match that follows one", () => {
    // The regression: this came back [] while every other figure was already
    // correct, which made it look like a hand-capture bug rather than a whole
    // run of dropped messages. Message numbering restarts per match, so the
    // ids the previous match had handled masked this one's opening messages as
    // re-deliveries — up to the first id the previous match happened not to
    // use. The opening hand is read from msgId 8-9, so it went with them.
    const game = matches[1].games[0];
    expect(game.handsDrawn).toEqual([
      [94869, 102773, 83896, 89191, 77058, 58403, 94869],
    ]);
    expect(game.cardsCast).toHaveLength(6);
    expect(game.cardsSeen).toHaveLength(6);
    expect(game.time).toBe(146);
    expect(game.winner).toBe(2);
  });

  it("scores each match on its own", () => {
    expect(matches.map((m) => m.opponent)).toEqual([
      "jonnyderdon",
      "conceptiongl",
    ]);
    // The player sat on a different side each time, and won both. So the
    // winning team id has to differ between the two — a result carried over
    // from the previous match would show up as the same number twice.
    expect(matches.map((m) => m.playerSeat)).toEqual([1, 2]);
    expect(
      matches.map((m) =>
        m.results
          .filter((r) => r.scope === "MatchScope_Match")
          .map((r) => r.winningTeamId)
      )
    ).toEqual([[1], [2]]);
    expect(matches.map((m) => m.games[0].winner)).toEqual([1, 2]);
    expect(matches.map((m) => m.games[0].onThePlay)).toEqual([2, 2]);
  });
});

describe("a three game match", () => {
  let match;

  beforeAll(async () => {
    const { completed } = await replay("greBo3.log");
    [match] = completed;
  });

  it("records three separate games", () => {
    expect(match.opponent).toBe("Dzees");
    expect(match.games).toHaveLength(3);
    expect(match.games.every(Boolean)).toBe(true);
  });

  it("gives every game its own opening hand", () => {
    // Games two and three both used to come back holding game two's hand, with
    // a phantom four-card second entry: numbering restarts at 1 for each game,
    // but 1 was already in the handled-ids set by game three, so the message
    // that announces the new game was dropped as a repeat and the reset that
    // clears the previous game never ran.
    const hands = match.games.map((g) => g.handsDrawn[0]);
    expect(hands[0]).toEqual([91099, 58415, 91099, 98025, 98025, 89191, 77505]);
    expect(hands[1]).toEqual([
      68738, 102767, 91099, 77492, 98025, 77062, 68552,
    ]);
    expect(hands[2]).toEqual([
      102508, 91099, 77492, 98025, 68740, 102508, 102771,
    ]);
    expect(new Set(hands.map(String)).size).toBe(3);
  });

  it("counts each game separately rather than accumulating", () => {
    // Game three inherited game two's totals and added its own on top: seen
    // cards 11 -> 22, timers 195s -> 441s, and a cast list that never cleared.
    expect(match.games.map((g) => g.cardsSeen.length)).toEqual([10, 11, 8]);
    expect(match.games.map((g) => g.cardsCast.length)).toEqual([11, 7, 10]);
    expect(match.games.map((g) => g.time)).toEqual([272, 195, 192]);
  });

  it("keeps a mulligan on the game that took it", () => {
    // Only game three mulliganed. A shared handsDrawn array had put a second
    // entry on games that never did.
    expect(match.games.map((g) => g.handsDrawn.length)).toEqual([1, 1, 2]);
  });

  // Everything below already worked. It is here because it is what quietly
  // breaks when the parser is touched, and none of it is checked anywhere else.

  it("scores the match one game at a time", () => {
    // Seat 2 is the player: won game one, lost the next two, lost the match.
    expect([match.playerSeat, match.oppSeat]).toEqual([2, 1]);
    expect(match.player).toBe("Manuel777");
    expect(match.results.map((r) => `${r.scope}:${r.winningTeamId}`)).toEqual([
      "MatchScope_Game:2",
      "MatchScope_Game:1",
      "MatchScope_Game:1",
      "MatchScope_Match:1",
    ]);
    expect(match.games.map((g) => g.winner)).toEqual([2, 1, 1]);
    const won = match.results.filter(
      (r) => r.scope === "MatchScope_Game" && r.winningTeamId === 2
    ).length;
    expect([won, 3 - won]).toEqual([1, 2]);
  });

  it("tracks who was on the play each game", () => {
    // Loser of the previous game chooses, so this alternates with the results
    // above rather than repeating.
    expect(match.games.map((g) => g.onThePlay)).toEqual([2, 1, 2]);
  });

  it("records what was sideboarded between games", () => {
    // Game one has none by definition — there is nothing before it to diff
    // against, and getMatchGameStats only fills these in from game two.
    expect(match.games[0].sideboardChanges).toEqual({ added: [], removed: [] });

    expect(match.games[1].sideboardChanges).toEqual({
      added: [90717, 90717],
      removed: [73905, 73905],
    });
    expect(match.games[2].sideboardChanges).toEqual({
      added: [73905, 73905, 90799, 90799],
      removed: [90717, 90717, 102508, 102508],
    });

    // Every swap is one-for-one, so the deck stays legal across the match.
    match.games.forEach((game) => {
      expect(game.sideboardChanges.added).toHaveLength(
        game.sideboardChanges.removed.length
      );
    });
  });

  it("attaches the deck as played to each game after the first", () => {
    const count = (list) => list.reduce((total, c) => total + c.quantity, 0);
    match.games.slice(1).forEach((game) => {
      expect(game.deck.name).toBe("Timeless Phoenix");
      expect(count(game.deck.mainDeck)).toBe(60);
      expect(count(game.deck.sideboard)).toBe(15);
    });
  });
});
