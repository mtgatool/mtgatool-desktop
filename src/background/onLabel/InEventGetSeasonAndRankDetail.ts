import { SeasonAndRankDetail } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: SeasonAndRankDetail;
}

export default function onLabelInEventGetSeasonAndRankDetail(
  entry: Entry
): void {
  const _json = entry.json;
}
