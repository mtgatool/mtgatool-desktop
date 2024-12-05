export interface SeasonalRankData {
  eventId: string;
  id: string;
  lastMatchId: string;
  newClass: string;
  newLevel: number;
  newStep: number;
  oldClass: string;
  oldLevel: number;
  oldStep: number;
  owner: string;
  arenaId: string;
  playerId: string;
  rankUpdateType: string;
  seasonOrdinal: number;
  timestamp: number;
  wasLossProtected: boolean;
  oldRankNumeric?: number;
  newRankNumeric?: number;
  date?: Date;
}
