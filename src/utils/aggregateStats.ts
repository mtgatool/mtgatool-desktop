import { Colors } from "mtgatool-shared";
import { DbMatch, StatsDeck } from "../types/dbTypes";

interface Winrate {
  wins: number;
  losses: number;
}

export interface AggregatedStats {
  decks: Record<string, string[]>; // Record<deckId, deckhash[]>
  deckIndex: Record<string, StatsDeck>; // Record<deckHash, dbDeck>
  myColorWinrates: Record<number, Winrate>;
  vsColorWinrates: Record<number, Winrate>;
  gamesWinrate: Winrate;
  matchesWinrate: Winrate;
}

export default function aggregateStats(
  matchesList: DbMatch[]
): AggregatedStats {
  // Defaults
  const stats: AggregatedStats = {
    decks: {},
    deckIndex: {},
    myColorWinrates: {},
    vsColorWinrates: {},
    gamesWinrate: {
      wins: 0,
      losses: 0,
    },
    matchesWinrate: {
      wins: 0,
      losses: 0,
    },
  };

  // Aggregate all matches
  matchesList.forEach((match) => {
    const hasWon = match.playerWins > match.playerLosses;

    if (hasWon) {
      stats.matchesWinrate.wins += 1;
    } else {
      stats.matchesWinrate.losses += 1;
    }
    stats.gamesWinrate.wins += match.playerWins;
    stats.gamesWinrate.losses += match.playerLosses;

    const { playerDeck } = match.internalMatch;

    if (!stats.deckIndex[match.playerDeckHash]) {
      const deckColors: any = playerDeck.colors;
      stats.deckIndex[match.playerDeckHash] = {
        id: playerDeck.id,
        deckTileId: playerDeck.deckTileId,
        name: playerDeck.name,
        mainDeck: playerDeck.mainDeck,
        sideboard: playerDeck.sideboard,
        colors:
          typeof deckColors !== "number"
            ? new Colors().addFromArray(deckColors || []).getBits()
            : playerDeck.colors || 0,
        playerId: match.playerId,
        deckHash: match.playerDeckHash,
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
        stats.decks[playerDeck.id] = [match.playerDeckHash];
      } else {
        stats.decks[playerDeck.id].push(match.playerDeckHash);
      }
    } else {
      const deckToUpdate = stats.deckIndex[match.playerDeckHash];
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
