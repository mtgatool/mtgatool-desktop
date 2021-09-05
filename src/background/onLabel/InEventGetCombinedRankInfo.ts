import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

export interface CombinedRankInfo {
  playerId: string;
  constructedSeasonOrdinal: number;
  constructedClass: string;
  constructedLevel: number;
  constructedStep: number;
  constructedMatchesWon: number;
  constructedMatchesLost: number;
  constructedMatchesDrawn: number;
  limitedSeasonOrdinal: number;
  limitedClass: string;
  limitedLevel: number;
  limitedStep: number;
  limitedMatchesWon: number;
  limitedMatchesLost: number;
  limitedMatchesDrawn: number;
  constructedPercentile: number;
  constructedLeaderboardPlace: number;
  limitedPercentile: number;
  limitedLeaderboardPlace: number;
}

interface Entry extends LogEntry {
  json: CombinedRankInfo;
}

export default function InEventGetCombinedRankInfo(entry: Entry): void {
  const { json } = entry;

  postChannelMessage({
    type: "UPSERT_DB_RANK",
    value: json,
  });
}
