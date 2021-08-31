import { InternalMatch } from "../../../../../mtgatool-shared/dist";
import { DbMatch } from "../../../types/dbTypes";
import baseToObj from "../../../utils/baseToObj";
import getRankFilterVal from "./getRankFilterVal";

// This interface is used only to pass to the filters and sorting table
// It should be kept as simple as possible!
export interface MatchData {
  matchId: string;
  internalMatch: string;
  playerDeckName: string;
  timestamp: number;
  duration: number;
  win: boolean;
  eventId: string;
  oppDeckColors: number;
  playerDeckColors: number;
  playerWins: number;
  playerLosses: number;
  rank: number;
}

export default function getMatchesData(matches: DbMatch[]): MatchData[] {
  return matches.map((match) => {
    const internalMatch = baseToObj<InternalMatch>(match.internalMatch);
    return {
      matchId: match.matchId,
      internalMatch: match.internalMatch,
      playerDeckName: internalMatch.player.name,
      timestamp: match.timestamp,
      duration: match.duration,
      win: match.playerWins > match.playerLosses,
      eventId: match.eventId,
      playerDeckColors: match.playerDeckColors,
      oppDeckColors: match.oppDeckColors,
      playerWins: match.playerWins,
      playerLosses: match.playerLosses,
      rank: getRankFilterVal(internalMatch.player.rank),
    };
  });
}
