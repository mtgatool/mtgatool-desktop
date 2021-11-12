/* eslint-disable radix */
import { Colors } from "mtgatool-shared";
import { MatchData } from "../components/views/history/getMatchesData";
import { StatsDeck } from "../types/dbTypes";

export interface Winrate {
  wins: number;
  losses: number;
}

export interface AggregatedStats {
  decks: Record<string, string[]>; // Record<deckId, deckhash[]>
  deckIndex: Record<string, StatsDeck>; // Record<deckHash, dbDeck>
  eventsIndex: string[];
  myColorWinrates: Record<number, Winrate>;
  vsColorWinrates: Record<number, Winrate>;
  timePlayed: number;
  gamesWinrate: Winrate;
  matchesWinrate: Winrate;
  onThePlayWinrate: Winrate;
  onTheDrawWinrate: Winrate;
}

export default function aggregateStats(
  matchesList: MatchData[]
): AggregatedStats {
  // Defaults
  const stats: AggregatedStats = {
    decks: {},
    deckIndex: {},
    eventsIndex: [],
    myColorWinrates: {},
    vsColorWinrates: {},
    timePlayed: 0,
    gamesWinrate: {
      wins: 0,
      losses: 0,
    },
    matchesWinrate: {
      wins: 0,
      losses: 0,
    },
    onThePlayWinrate: {
      wins: 0,
      losses: 0,
    },
    onTheDrawWinrate: {
      wins: 0,
      losses: 0,
    },
  };

  // Aggregate all matches
  matchesList.forEach((match) => {
    const playerSeat = match.internalMatch.player.seat;
    const hasWon = match.playerWins > match.playerLosses;

    if (hasWon) {
      stats.matchesWinrate.wins += 1;
    } else {
      stats.matchesWinrate.losses += 1;
    }
    // stats.gamesWinrate.wins += match.playerWins;
    // stats.gamesWinrate.losses += match.playerLosses;

    const { playerDeck } = match.internalMatch;

    const pDecKColors = match.internalMatch.playerDeck.colors as
      | number[]
      | number;
    const playerColors = new Colors();
    if (typeof pDecKColors === "number") playerColors.addFromBits(pDecKColors);
    else playerColors.addFromArray(pDecKColors);

    const oDecKColors = match.internalMatch.oppDeck.colors as number[] | number;
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

    if (!stats.myColorWinrates[pColorBits]) {
      stats.myColorWinrates[pColorBits] = {
        wins: 0,
        losses: 0,
      };
    }

    if (!stats.vsColorWinrates[oColorBits]) {
      stats.vsColorWinrates[oColorBits] = {
        wins: 0,
        losses: 0,
      };
    }

    if (!stats.eventsIndex.includes(match.eventId)) {
      stats.eventsIndex.push(match.eventId);
    }

    stats.timePlayed += match.duration;
    Object.keys(match.internalMatch.gameStats).forEach((gameNum) => {
      const game = match.internalMatch.gameStats[parseInt(gameNum)];

      if (game) {
        if (game.winner === playerSeat) {
          stats.myColorWinrates[pColorBits].wins += 1;
          stats.vsColorWinrates[oColorBits].wins += 1;
          stats.gamesWinrate.wins += 1;
          if (game.onThePlay === playerSeat) stats.onThePlayWinrate.wins += 1;
          if (game.onThePlay !== playerSeat) stats.onTheDrawWinrate.wins += 1;
        } else {
          stats.myColorWinrates[pColorBits].losses += 1;
          stats.vsColorWinrates[oColorBits].losses += 1;
          stats.gamesWinrate.losses += 1;
          if (game.onThePlay === playerSeat) stats.onThePlayWinrate.losses += 1;
          if (game.onThePlay !== playerSeat) stats.onTheDrawWinrate.losses += 1;
        }
      }
    });

    if (!stats.deckIndex[match.internalMatch.playerDeckHash]) {
      const deckColors: any = playerDeck.colors;

      const dc =
        typeof deckColors !== "number"
          ? new Colors().addFromArray(deckColors || []).getBits()
          : playerDeck.colors || 0;

      // if (dc > 31 && dc !== 32) {
      //   dc -= 32;
      // }

      stats.deckIndex[match.internalMatch.playerDeckHash] = {
        id: playerDeck.id,
        deckTileId: playerDeck.deckTileId,
        name: playerDeck.name,
        mainDeck: playerDeck.mainDeck,
        sideboard: playerDeck.sideboard,
        colors: dc,
        playerId: match.uuid,
        deckHash: match.internalMatch.playerDeckHash,
        matches: {
          [match.matchId]: hasWon,
        },
        lastUsed: match.timestamp,
        stats: {
          gameWins: match.playerWins,
          gameLosses: match.playerLosses,
          matchWins: hasWon ? 1 : 0,
          matchLosses: hasWon ? 0 : 1,
        },
        totalGames: match.playerWins + match.playerLosses,
        winrate:
          match.playerWins > 0
            ? (100 / (match.playerWins + match.playerLosses)) * match.playerWins
            : 0,
      };

      if (!stats.decks[playerDeck.id]) {
        stats.decks[playerDeck.id] = [match.internalMatch.playerDeckHash];
      } else {
        stats.decks[playerDeck.id].push(match.internalMatch.playerDeckHash);
      }
    } else {
      const deckToUpdate = stats.deckIndex[match.internalMatch.playerDeckHash];
      deckToUpdate.lastUsed =
        match.timestamp > deckToUpdate.lastUsed
          ? match.timestamp
          : deckToUpdate.lastUsed;
      deckToUpdate.stats.gameWins += match.playerWins;
      deckToUpdate.stats.gameLosses += match.playerLosses;
      deckToUpdate.stats.matchWins += hasWon ? 1 : 0;
      deckToUpdate.stats.matchLosses += hasWon ? 0 : 1;
      deckToUpdate.totalGames =
        deckToUpdate.stats.gameWins + deckToUpdate.stats.gameLosses;
      deckToUpdate.winrate =
        deckToUpdate.stats.gameWins > 0
          ? (100 / deckToUpdate.totalGames) * deckToUpdate.stats.gameWins
          : 0;
    }
  });

  // ..
  return stats;
}
