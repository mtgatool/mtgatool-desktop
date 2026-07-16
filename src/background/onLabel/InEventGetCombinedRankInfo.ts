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
export default async function InEventGetCombinedRankInfo(
  _entry: Entry
): Promise<void> {
  // Rank now comes ONLY from live game memory — 2026 dropped class/step from
  // the log payload. Skip during catch-up, and if the memory read is
  // missing/invalid (MTGA closed, unreadable) do nothing: never overwrite the
  // stored rank with a default.
  if (!isLiveLog()) return;

  // The client requests this label right as the post-match rank screen comes
  // up, but it writes the NEW rank into memory slightly AFTER the log line —
  // a single immediate read raced it and captured the pre-match rank, so a
  // rank-up didn't show until the next match. Read now and re-read a couple of
  // times so the updated rank lands. Reads are async (native threadpool) and
  // upsertDbRank/cloud push dedup unchanged values, so retries are cheap.
  // eslint-disable-next-line no-restricted-syntax
  for (const delay of [0, 4000, 15000]) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, delay));
    // eslint-disable-next-line no-await-in-loop
    const memoryRank = await readRank();
    if (memoryRank) {
      postChannelMessage({
        type: "UPSERT_DB_RANK",
        value: { ...memoryRank },
      });
    }
  }
}
