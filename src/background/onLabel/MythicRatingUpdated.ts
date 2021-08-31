import { MythicRatingUpdate } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: MythicRatingUpdate;
}

export default function MythicRatingUpdated(entry: Entry): void {
  const { json } = entry;

  const { rank } = globalStore;

  // Ugh, no type on the mythic rank update!
  const type =
    globalStore.currentMatch.gameInfo.superFormat == "SuperFormat_Limited"
      ? "limited"
      : "constructed";

  rank[type].percentile = json.newMythicPercentile;
  rank[type].leaderboardPlace = json.newMythicLeaderboardPlacement;

  postChannelMessage({
    type: "UPSERT_DB_RANK",
    value: rank,
    uuid: getLocalSetting("playerId"),
  });
}
