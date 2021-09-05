import { RankUpdate } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";

import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: RankUpdate;
}

// DEPRECTATED
export default function RankUpdated(entry: Entry): void {
  const { json } = entry;
  if (json.newClass == "Mythic" && json.oldClass == "Mythic") return;

  const { rank } = globalStore;

  const updateType = json.rankUpdateType.toLowerCase() as
    | "constructed"
    | "limited";

  if (updateType === "constructed") {
    rank.constructedClass = json.newClass;
    rank.constructedLevel = json.newLevel;
    rank.constructedStep = json.newStep;
    rank.constructedSeasonOrdinal = json.seasonOrdinal;
  } else {
    rank.limitedClass = json.newClass;
    rank.limitedLevel = json.newLevel;
    rank.limitedStep = json.newStep;
    rank.limitedSeasonOrdinal = json.seasonOrdinal;
  }

  postChannelMessage({
    type: "UPSERT_DB_RANK",
    value: rank,
  });
}
