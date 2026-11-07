import { MatchData } from "../../components/views/history/convertDbMatchData";
import aggregateStats from "../aggregateStats";
import testSeedDatabase from "../testSeedDatabase";

testSeedDatabase();

function matchWithCasts(ids: number[], winner = 1): MatchData {
  return {
    uuid: "player",
    matchId: "match",
    timestamp: 1,
    duration: 60,
    eventId: "Play",
    playerWins: winner === 1 ? 1 : 0,
    playerLosses: winner === 1 ? 0 : 1,
    internalMatch: {
      player: { seat: 1 },
      opponent: { rank: "Gold" },
      playerDeckHash: "deck",
      playerDeck: {
        id: "deck",
        name: "Rooms",
        colors: 4,
        mainDeck: [{ id: 92196, quantity: 4 }],
        sideboard: [],
      },
      oppDeck: { colors: 1 },
      gameStats: [
        {
          winner,
          onThePlay: 1,
          cardsCast: ids.map((grpId, index) => ({
            grpId,
            player: 1,
            turn: 5 + index * 2,
          })),
          handsDrawn: [[92196]],
        },
      ],
    },
  } as unknown as MatchData;
}

it.each([92197, 92198, 92196])(
  "counts Room cast %i under the full card alongside its opening hand",
  (id) => {
    const { cardWinrates } = aggregateStats([matchWithCasts([id])]).deckIndex.deck;
    expect(Object.keys(cardWinrates)).toEqual(["92196"]);
    expect(cardWinrates[92196]).toMatchObject({
      wins: 1,
      losses: 0,
      initHandWins: 1,
      turnsFirstUsed: [3],
      turnsUsed: [3],
    });
  }
);

it("counts a game only once when both Room doors are cast", () => {
  const { cardWinrates } = aggregateStats([
    matchWithCasts([92197, 92198, 92197], 2),
  ]).deckIndex.deck;
  expect(Object.keys(cardWinrates)).toEqual(["92196"]);
  expect(cardWinrates[92196]).toMatchObject({
    wins: 0,
    losses: 1,
    initHandsLosses: 1,
    turnsFirstUsed: [3],
    turnsUsed: [3, 4, 5],
  });
});

it("excludes opponents' Room casts", () => {
  const match = matchWithCasts([92197]);
  match.internalMatch.gameStats[0]!.cardsCast[0].player = 2;
  const { cardWinrates } = aggregateStats([match]).deckIndex.deck;
  expect(cardWinrates[92196].wins).toBe(0);
  expect(cardWinrates[92196].initHandWins).toBe(1);
});
