/* eslint-disable no-bitwise */
/* eslint-disable radix */
import { Colors, database, DbCardData, v2cardsList } from "mtgatool-shared";
import { DEFAULT_TILE } from "mtgatool-shared/dist/shared/constants";
import { DbMatch } from "../../../types/dbTypes";
import { Winrate } from "../../../utils/aggregateStats";
import getWinrateValue from "../../../utils/getWinrateValue";
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

export interface ExploreTempCardData {
  cardObj?: DbCardData;
  winrate: Winrate;
  initHandWinrate: Winrate;
  sideInWinrate: Winrate;
  sideOutWinrate: Winrate;
  ranks: number;
  quantities: number[];
  mulligans: number;
  turnsUsed: number[];
  turnsFirstUsed: number[];
}

export interface ExploreCardData {
  id: number;
  name: string;
  winrate: Winrate;
  initHandWinrate: Winrate;
  sideInWinrate: Winrate;
  sideOutWinrate: Winrate;
  ranks: number;
  mulligans: number;
  avgQuantity: number;
  avgTurn: number;
  avgTurnUsed: number;
  avgFirstTurn: number;
}

function newCardWinrate(grpId: number): ExploreTempCardData {
  return {
    cardObj: database.card(grpId),
    winrate: { wins: 0, losses: 0 },
    initHandWinrate: { wins: 0, losses: 0 },
    sideInWinrate: { wins: 0, losses: 0 },
    sideOutWinrate: { wins: 0, losses: 0 },
    ranks: 0,
    quantities: [],
    mulligans: 0,
    turnsUsed: [],
    turnsFirstUsed: [],
  };
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
  cards: ExploreCardData[];
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

  const tempCards: Record<string, ExploreTempCardData> = {};

  const aggregated: DbExploreAggregated = {
    aggregator: window.toolDb.user?.pubKey || "",
    eventId: allData[0]?.eventId || "",
    from: new Date().getTime(),
    to: new Date().getTime(),
    entries: 0,
    cards: [],
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

      let addDelta: number[] = [];
      let remDelta: number[] = [];

      Object.keys(match.internalMatch.gameStats).forEach((gameNum) => {
        const game = match.internalMatch.gameStats[parseInt(gameNum)];

        if (game) {
          if (game.winner === playerSeat) {
            data.gWins += 1;
          } else {
            data.gLosses += 1;
          }

          const gameCards: number[] = [];
          const wins = game.winner === playerSeat ? 1 : 0;
          const losses = game.winner === playerSeat ? 0 : 1;
          // For each card cast
          game.cardsCast?.forEach((cardCast) => {
            const { grpId, player, turn } = cardCast;

            // Only if we casted it
            if (player == playerSeat) {
              // define
              if (!tempCards[grpId]) tempCards[grpId] = newCardWinrate(grpId);
              const cardData = tempCards[grpId];
              // Only once per card cast!
              if (!gameCards.includes(grpId)) {
                cardData.turnsFirstUsed.push(Math.ceil(turn / 2));
                cardData.winrate.wins += wins;
                cardData.winrate.losses += losses;

                // if (!cardData.colors[oColorBits]) {
                //   cardData.colors[oColorBits] = {
                //     wins: 0,
                //     losses: 0,
                //   };
                // }
                // cardData.colors[oColorBits].wins += wins;
                // cardData.colors[oColorBits].losses += losses;
                gameCards.push(grpId);
              }
              // Do this for every card cast in the game
              cardData.turnsUsed.push(Math.ceil(turn / 2));
            }
          });

          game.handsDrawn?.forEach((hand, index) => {
            // Initial hand
            if (hand) {
              if (index == game.handsDrawn.length - 1) {
                hand.forEach((grpId) => {
                  // define
                  if (!tempCards[grpId])
                    tempCards[grpId] = newCardWinrate(grpId);
                  tempCards[grpId].initHandWinrate.wins += wins;
                  tempCards[grpId].initHandWinrate.losses += losses;
                });
              } else {
                hand.forEach((grpId) => {
                  if (!tempCards[grpId])
                    tempCards[grpId] = newCardWinrate(grpId);
                  tempCards[grpId].mulligans += 1;
                });
              }
            }
          });

          // Add the previos changes to the current ones
          addDelta = [...addDelta, ...(game.sideboardChanges?.added || [])];
          remDelta = [...remDelta, ...(game.sideboardChanges?.removed || [])];

          addDelta.forEach((grpId) => {
            // define
            if (!tempCards[grpId]) tempCards[grpId] = newCardWinrate(grpId);
            // tempCards[grpId].sidedIn += 1;
            // Only add if the card was used
            if (gameCards.includes(grpId)) {
              tempCards[grpId].sideInWinrate.wins += wins;
              tempCards[grpId].sideInWinrate.losses += losses;
            }
          });
          remDelta.forEach((grpId) => {
            // define
            if (!tempCards[grpId]) tempCards[grpId] = newCardWinrate(grpId);
            // winrates[grpId].sidedOut += 1;
            // Only add if the card was not used
            if (!gameCards.includes(grpId)) {
              tempCards[grpId].sideOutWinrate.wins += wins;
              tempCards[grpId].sideOutWinrate.losses += losses;
            }
          });
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

  aggregated.cards = Object.values(tempCards).map(temp => {
    return {
      id: temp.cardObj?.id || 0,
      name: temp.cardObj?.name || "";
      winrate: getWinrateValue(temp.winrate.wins, temp.winrate.losses),
      initHandWinrate: getWinrateValue(temp.initHandWinrate.wins, temp.initHandWinrate.losses),
      sideInWinrate: getWinrateValue(temp.sideInWinrate.wins, temp.sideInWinrate.losses),
      sideOutWinrate: getWinrateValue(temp.sideOutWinrate.wins, temp.sideOutWinrate.losses),
      ranks: temp.ranks,
      mulligans: temp.mulligans,
      avgQuantity: temp.quantities,
      avgTurn: 0,
      avgTurnUsed: 0,
      avgFirstTurn: 0,
    }
  })

  return aggregated;
}
