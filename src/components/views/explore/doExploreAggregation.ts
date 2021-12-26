/* eslint-disable no-bitwise */
/* eslint-disable radix */
import { Colors, database, v2cardsList } from "mtgatool-shared";
import { DEFAULT_TILE } from "mtgatool-shared/dist/shared/constants";
import { DbMatch } from "../../../types/dbTypes";
import { Winrate } from "../../../utils/aggregateStats";
import getRankFilterVal from "../history/getRankFilterVal";

export interface ExploreDeckData {
  wr: number;
  wins: number;
  losses: number;
  gWins: number;
  gLosses: number;
  colors: number;
  ranks: number;
  pilots: string[];
  durations?: number[];
  avgDuration: number;
  colorWinrates: Record<string, Winrate>;
  bestCards: Record<string, number>;
  worstMatchCards: Record<string, number>;
  bestMatchCards: Record<string, number>;
  deck: v2cardsList;
  side: v2cardsList;
  name: string;
  tile: number;
}

function newDefaultExploreData(): ExploreDeckData {
  return {
    wr: 0,
    wins: 0,
    losses: 0,
    gWins: 0,
    gLosses: 0,
    colors: 0,
    ranks: 0,
    pilots: [],
    durations: [],
    avgDuration: 0,
    colorWinrates: {},
    bestCards: {},
    worstMatchCards: {},
    bestMatchCards: {},
    deck: [],
    side: [],
    name: "",
    tile: DEFAULT_TILE,
  };
}

export interface DbExploreAggregated {
  aggregator: string;
  eventId: string;
  from: number;
  to: number;
  entries: number;
  data: Record<string, ExploreDeckData>;
}

export function limitRecord(
  record: Record<string, number>,
  limit: number
): Record<string, number> {
  const newRecord: Record<string, number> = {};
  Object.keys(record)
    .map((k) => {
      const v = record[k];
      return {
        k,
        v,
      };
    })
    .sort((a, b) => {
      if (a.v > b.v) return -1;
      if (b.v > a.v) return 1;
      return 0;
    })
    .splice(0, limit)
    .forEach((d) => {
      newRecord[d.k] = d.v;
    });

  return newRecord;
}

export default function doExploreAggregation(allData: DbMatch[]) {
  // console.log(allData);

  const aggregated: DbExploreAggregated = {
    aggregator: window.toolDb.user?.pubKey || "",
    eventId: allData[0]?.eventId || "",
    from: new Date().getTime(),
    to: new Date().getTime(),
    entries: 0,
    data: {} as Record<string, ExploreDeckData>,
  };

  Object.values(allData).forEach((match) => {
    const deckhash = match?.playerDeckHash;
    if (deckhash) {
      if (!aggregated.data[deckhash]) {
        aggregated.data[deckhash] = newDefaultExploreData();
      }
      const data = aggregated.data[deckhash];
      aggregated.entries += 1;
      if (match.timestamp < aggregated.from) aggregated.from = match.timestamp;
      if (match.timestamp > aggregated.to) aggregated.to = match.timestamp;

      const playerSeat = match.internalMatch.player.seat;
      const hasWon = match.playerWins > match.playerLosses;
      const { playerDeck } = match.internalMatch;

      if (hasWon) {
        data.wins += 1;
      } else {
        data.losses += 1;
      }

      if (!data.pilots.includes(match.playerName)) {
        data.pilots.push(match.playerName);
      }

      data.ranks |= getRankFilterVal(match.internalMatch.player.rank);

      const pDecKColors = playerDeck.colors as number[] | number;
      const playerColors = new Colors();
      if (typeof pDecKColors === "number")
        playerColors.addFromBits(pDecKColors);
      else playerColors.addFromArray(pDecKColors);

      const oDecKColors = match.internalMatch.oppDeck.colors as
        | number[]
        | number;
      const oppColors = new Colors();
      if (typeof oDecKColors === "number") oppColors.addFromBits(oDecKColors);
      else oppColors.addFromArray(oDecKColors);

      let pColorBits = playerColors.getBits();
      let oColorBits = oppColors.getBits();

      if (pColorBits > 31 && pColorBits !== 32) {
        pColorBits -= 32;
      }

      if (oColorBits > 31 && oColorBits !== 32) {
        oColorBits -= 32;
      }

      data.colors = pColorBits;
      data.durations?.push(match.duration);

      if (playerDeck?.mainDeck) {
        data.name = playerDeck.name;
        data.tile = playerDeck.deckTileId;
        data.deck = playerDeck.mainDeck.map((c) => {
          // eslint-disable-next-line no-param-reassign
          if (c.measurable) delete c.measurable;
          return c;
        });
      }
      if (playerDeck?.sideboard) {
        data.side = playerDeck.sideboard.map((c) => {
          // eslint-disable-next-line no-param-reassign
          if (c.measurable) delete c.measurable;
          return c;
        });
      }

      if (!data.colorWinrates[oColorBits]) {
        data.colorWinrates[oColorBits] = {
          wins: 0,
          losses: 0,
        };
      }

      //
      if (hasWon) {
        data.colorWinrates[oColorBits].wins =
          (data.colorWinrates[oColorBits].wins || 0) + 1;

        match.internalMatch.player.cardsUsed.forEach((c) => {
          const dbObj = database.card(c);
          if (dbObj && !dbObj.type.toLowerCase().includes("land")) {
            data.bestCards[c] = (data.bestCards[c] ?? 0) + 1;
          }
        });

        match.internalMatch.oppDeck.mainDeck.forEach((c) => {
          const dbObj = database.card(c.id);
          if (dbObj && !dbObj.type.toLowerCase().includes("land")) {
            data.bestMatchCards[c.id] =
              (data.bestMatchCards[c.id] ?? 0) + c.quantity;
          }
        });
      } else {
        data.colorWinrates[oColorBits].losses =
          (data.colorWinrates[oColorBits].losses || 0) + 1;

        match.internalMatch.oppDeck.mainDeck.forEach((c) => {
          const dbObj = database.card(c.id);
          if (dbObj && !dbObj.type.toLowerCase().includes("land")) {
            data.worstMatchCards[c.id] =
              (data.worstMatchCards[c.id] ?? 0) + c.quantity;
          }
        });
      }

      Object.keys(match.internalMatch.gameStats).forEach((gameNum) => {
        const game = match.internalMatch.gameStats[parseInt(gameNum)];

        if (game) {
          if (game.winner === playerSeat) {
            data.gWins += 1;
          } else {
            data.gLosses += 1;
          }
        }
      });
    }
  });

  Object.keys(aggregated.data).forEach((id) => {
    const data = aggregated.data[id];
    data.bestCards = limitRecord(data.bestCards, 5);
    data.bestMatchCards = limitRecord(data.bestMatchCards, 5);
    data.worstMatchCards = limitRecord(data.worstMatchCards, 5);

    const total = data.wins + data.losses;
    data.wr = total > 0 ? (100 / total) * data.wins : 0;

    if (data.durations) {
      data.avgDuration =
        data.durations.reduce((acc, c) => acc + c, 0) / data.durations.length;
    }
    delete data.durations;

    // if (total <= 3) {
    //   delete aggregated.data[id];
    // }
  });

  return aggregated;
}
