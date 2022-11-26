import { MythicRatingUpdate } from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: MythicRatingUpdate;
}

// DEPRECATED
export default function MythicRatingUpdated(entry: Entry): void {
  const { json } = entry;

  const { rank } = globalStore;

  // Ugh, no type on the mythic rank update!
  const type =
    globalStore.currentMatch.gameInfo.superFormat == "SuperFormat_Limited"
      ? "limited"
      : "constructed";

  if (type === "constructed") {
    rank.constructedPercentile = json.newMythicPercentile;
    rank.constructedLeaderboardPlace = json.newMythicLeaderboardPlacement;
  } else {
    rank.limitedPercentile = json.newMythicPercentile;
    rank.limitedLeaderboardPlace = json.newMythicLeaderboardPlacement;
  }

  // postChannelMessage({
  //   type: "UPSERT_DB_RANK",
  //   value: rank,
  // });
}
