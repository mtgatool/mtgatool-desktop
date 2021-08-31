import { InternalRank } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface EntryJson {
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
  json: EntryJson;
}

export default function InEventGetCombinedRankInfo(entry: Entry): void {
  const { json } = entry;

  const rank: InternalRank = {
    constructed: {
      rank: json.constructedClass,
      tier: json.constructedLevel,
      step: json.constructedStep,
      won: json.constructedMatchesWon,
      lost: json.constructedMatchesLost,
      drawn: json.constructedMatchesDrawn,
      percentile: json.constructedPercentile,
      leaderboardPlace: json.constructedLeaderboardPlace,
      seasonOrdinal: json.constructedSeasonOrdinal,
    },
    limited: {
      rank: json.limitedClass,
      tier: json.limitedLevel,
      step: json.limitedStep,
      won: json.limitedMatchesWon,
      lost: json.limitedMatchesLost,
      drawn: json.limitedMatchesDrawn,
      percentile: json.limitedPercentile,
      leaderboardPlace: json.limitedLeaderboardPlace,
      seasonOrdinal: json.limitedSeasonOrdinal,
    },
  };

  globalStore.rank = rank;

  postChannelMessage({
    type: "UPSERT_DB_RANK",
    value: rank,
    uuid: json.playerId,
  });
}
