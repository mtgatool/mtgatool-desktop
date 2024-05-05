import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readRank from "../../reader/readRank";
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

const rankClass: Record<number, string> = {
  "-1": "Unranked",
  "0": "Beginner",
  "1": "Bronze",
  "2": "Silver",
  "3": "Gold",
  "4": "Platinum",
  "5": "Diamond",
  "6": "Mythic",
};

interface Entry extends LogEntry {
  json: CombinedRankInfo;
}

export default function InEventGetCombinedRankInfo(entry: Entry): void {
  const { json } = entry;

  const memoryRank = readRank();

  if (memoryRank) {
    postChannelMessage({
      type: "UPSERT_DB_RANK",
      value: {
        ...memoryRank,
        constructedClass: rankClass[memoryRank.constructedClass],
        limitedClass: rankClass[memoryRank.limitedClass],
      },
    });
  } else {
    postChannelMessage({
      type: "UPSERT_DB_RANK",
      value: json,
    });
  }
}
