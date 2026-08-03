import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { SeasonAndRankDetail } from "../../types";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: SeasonAndRankDetail;
}

/**
 * The client asks for RankGetSeasonAndRankDetails on the home screen, and the
 * reply is the only place the season's start and end dates appear. This used to
 * discard the payload, which is why nothing could mark a season boundary: the
 * dates exist nowhere else — matches record rank/tier/step but no seasonOrdinal
 * — so once the line scrolls past, the boundary is unrecoverable.
 *
 * Only the *current* season is reported, so the stored set fills in one season
 * at a time as they're played through.
 */
export default function onLabelInEventGetSeasonAndRankDetail(
  entry: Entry
): void {
  const season = entry.json?.currentSeason;
  if (!season?.seasonOrdinal || !season.seasonStartTime) return;

  postChannelMessage({
    type: "UPSERT_DB_SEASON",
    value: {
      seasonOrdinal: season.seasonOrdinal,
      seasonStartTime: season.seasonStartTime,
      seasonEndTime: season.seasonEndTime,
    },
  });
}
