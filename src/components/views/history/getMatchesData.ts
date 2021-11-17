import { InternalMatch } from "mtgatool-shared/dist";
import getLocalDbValue from "../../../toolDb/getLocalDbValue";
import { DbMatch } from "../../../types/dbTypes";
import getRankFilterVal from "./getRankFilterVal";

// This interface is used only to pass to the filters and sorting table
// It should be kept as simple as possible!
export interface MatchData {
  uuid: string;
  matchId: string;
  internalMatch: InternalMatch;
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

export function convertDbMatchToData(match: DbMatch): MatchData {
  const { internalMatch } = match;
  return {
    uuid: match.playerId,
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
}

export default function getMatchesData(
  matchesIds: string[]
): Promise<MatchData[]> {
  const promises = matchesIds.map((id) => {
    return getLocalDbValue<DbMatch>(id);
  });

  return Promise.all(promises).then((matches) =>
    matches.filter((m) => m).map((m: any) => convertDbMatchToData(m))
  );
}
