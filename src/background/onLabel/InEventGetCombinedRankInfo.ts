import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readRank from "../../reader/readRank";
import LogEntry from "../../types/logDecoder";
import { isLiveLog } from "../logReadState";

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
  // Numeric rank class (0..6) kept alongside the string class name; set by the
  // memory reader (readRank), read via `as any` in the match-room handler.
  constructedClassValue?: number;
  limitedClassValue?: number;
}

export const rankClass: Record<number, string> = {
  "-1": "Unranked",
  "0": "Beginner",
  "1": "Bronze",
  "2": "Silver",
  "3": "Gold",
  "4": "Platinum",
  "5": "Diamond",
  "6": "Mythic",
  "7": "Mythic",
};

interface Entry extends LogEntry {
  json: CombinedRankInfo;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function InEventGetCombinedRankInfo(_entry: Entry): void {
  // Rank now comes ONLY from live game memory — 2026 dropped it from the log
  // payload. Skip during catch-up, and if the memory read is missing/invalid
  // (MTGA closed, unreadable) do nothing: never overwrite the stored rank from
  // the empty log payload, which rolled the player's rank back to a default.
  const memoryRank = isLiveLog() ? readRank() : null;
  if (!memoryRank) return;

  postChannelMessage({
    type: "UPSERT_DB_RANK",
    value: {
      ...memoryRank,
      constructedClass: memoryRank.constructedClass,
      limitedClass: memoryRank.limitedClass,
    },
  });
}
