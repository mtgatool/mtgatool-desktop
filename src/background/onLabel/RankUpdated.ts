import { RankUpdate } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";

import LogEntry from "../../types/logDecoder";
import globalStore from "../store";

interface Entry extends LogEntry {
  json: () => RankUpdate;
}

export default function RankUpdated(entry: Entry): void {
  const json = entry.json();
  if (json.newClass == "Mythic" && json.oldClass == "Mythic") return;

  const { rank } = globalStore;

  const updateType = json.rankUpdateType.toLowerCase() as
    | "constructed"
    | "limited";

  rank[updateType].rank = json.newClass;
  rank[updateType].tier = json.newLevel;
  rank[updateType].step = json.newStep;
  rank[updateType].seasonOrdinal = json.seasonOrdinal;

  postChannelMessage({
    type: "UPSERT_GUN_RANK",
    value: rank,
    uuid: json.playerId,
  });
}
