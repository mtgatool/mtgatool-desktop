/**
 * The MVP pick, against the two failures that prompted it: a land that only
 * ever damaged its own controller, and the loser's best card headlining a
 * match they lost.
 */
import getMatchMvp from "../getMatchMvp";

// Cards the scorer asks about. `database.card` reads the cards-db client
// cache, which is empty in a test, so it is stubbed with just the fields the
// scorer uses.
const CARDS: Record<number, { Types: string; Cmc: number; Power: string }> = {
  100: { Types: "Land", Cmc: 0, Power: "" }, // Ancient Tomb
  200: { Types: "Creature — Angel", Cmc: 5, Power: "4" },
  300: { Types: "Instant", Cmc: 1, Power: "" },
  400: { Types: "Creature — Elemental", Cmc: 7, Power: "7" },
  500: { Types: "Enchantment", Cmc: 3, Power: "" },
};

jest.mock("../../utils/mtga/database", () => ({
  __esModule: true,
  default: {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    card: (grpId: number) => (CARDS as never)[grpId],
  },
}));

const PLAYER = 1;
const OPP = 2;

function damageLine(
  seat: number,
  sourceGrpId: number,
  amount: number,
  targetId: number
) {
  return {
    type: "DAMAGE_DEALT" as const,
    seat,
    timestamp: 0,
    sourceGrpId,
    amount,
    targetType: "PLAYER",
    targetId,
  };
}

function log(lines: unknown[]) {
  return { version: 2, players: [], lines } as never;
}

function games(casts: { grpId: number; player: number; turn?: number }[]) {
  return [
    {
      time: 0,
      winner: PLAYER,
      handsDrawn: [],
      cardsCast: casts.map((c) => ({ turn: 1, ...c })),
      sideboardChanges: { added: [], removed: [] },
      deck: {},
      cardsSeen: [],
      onThePlay: 1,
    },
  ] as never;
}

describe("getMatchMvp", () => {
  it("ignores a land that only ever damaged its own controller", () => {
    // Ancient Tomb pings its controller 8 times; the Angel hits the opponent
    // twice for 4. The old pick was the land, by a mile.
    const lines = [
      ...Array.from({ length: 8 }, () => damageLine(PLAYER, 100, 2, PLAYER)),
      damageLine(PLAYER, 200, 4, OPP),
      damageLine(PLAYER, 200, 4, OPP),
    ];
    const mvp = getMatchMvp(
      games([
        { grpId: 100, player: PLAYER },
        { grpId: 200, player: PLAYER },
      ]),
      log(lines),
      PLAYER
    );
    expect(mvp?.grpId).toBe(200);
    expect(mvp?.reason).toBe("damage");
    expect(mvp?.value).toBe(8);
  });

  it("prefers the winner's card over a bigger one from the loser", () => {
    const lines = [
      // The loser's fatty did more damage, and still lost.
      damageLine(OPP, 400, 14, PLAYER),
      damageLine(PLAYER, 200, 6, OPP),
    ];
    const mvp = getMatchMvp(
      games([
        { grpId: 400, player: OPP },
        { grpId: 200, player: PLAYER },
      ]),
      log(lines),
      PLAYER
    );
    expect(mvp?.grpId).toBe(200);
    expect(mvp?.seat).toBe(PLAYER);
  });

  it("falls back to the loser when the winner did nothing at all", () => {
    // Conceded into an empty board: nothing on the winning side scored.
    const mvp = getMatchMvp(
      games([{ grpId: 400, player: OPP }]),
      log([damageLine(OPP, 400, 7, PLAYER)]),
      PLAYER
    );
    expect(mvp?.grpId).toBe(400);
    expect(mvp?.seat).toBe(OPP);
  });

  it("names the most cast spell when no damage was dealt", () => {
    const mvp = getMatchMvp(
      games([
        { grpId: 300, player: PLAYER },
        { grpId: 300, player: PLAYER },
        { grpId: 300, player: PLAYER },
        { grpId: 500, player: PLAYER },
      ]),
      log([]),
      PLAYER
    );
    expect(mvp?.grpId).toBe(300);
    expect(mvp?.reason).toBe("casts");
    expect(mvp?.value).toBe(3);
  });

  it("names the biggest permanent when nothing was repeated or damaging", () => {
    const mvp = getMatchMvp(
      games([
        { grpId: 500, player: PLAYER },
        { grpId: 200, player: PLAYER },
      ]),
      log([]),
      PLAYER
    );
    // Angel: cmc 5 + power 4 beats the enchantment's cmc 3.
    expect(mvp?.grpId).toBe(200);
    expect(mvp?.reason).toBe("board");
  });

  it("ignores damage dealt to permanents", () => {
    // A creature that only ever traded with other creatures is board control,
    // not a win condition; the PERMANENT target is what tells us so.
    const lines = [
      {
        type: "DAMAGE_DEALT" as const,
        seat: PLAYER,
        timestamp: 0,
        sourceGrpId: 400,
        amount: 20,
        targetType: "PERMANENT",
        targetId: 999,
      },
      damageLine(PLAYER, 200, 3, OPP),
    ];
    const mvp = getMatchMvp(
      games([
        { grpId: 400, player: PLAYER },
        { grpId: 200, player: PLAYER },
      ]),
      log(lines),
      PLAYER
    );
    expect(mvp?.grpId).toBe(200);
  });

  it("returns nothing when there is nothing to name", () => {
    expect(getMatchMvp([] as never, log([]), PLAYER)).toBeUndefined();
  });
});
