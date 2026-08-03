/**
 * Ranked season boundaries.
 *
 * Nothing else records when a season starts: matches don't carry a
 * seasonOrdinal (their `player` block has rank/tier/step but no season), so a
 * boundary cannot be recovered after the fact from stored history. The only
 * source is the client's RankGetSeasonAndRankDetails response, which reports
 * the *current* season only — so this accumulates one row per season as they
 * are observed, and the record grows over time rather than arriving complete.
 *
 * Seasons are roughly monthly but do not start on the 1st or at midnight
 * (season 92 began 2026-07-31T19:05:00Z), so the dates must be stored rather
 * than computed.
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbSeason, DbSeasons } from "../types/dbTypes";
import { getData, putData } from "./store";

const KEY = "seasons";

/** Arena writes these without a zone suffix; they are UTC. */
function parseArenaTime(value: string): number {
  if (!value) return 0;
  const iso = /(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

export async function getDbSeasons(): Promise<DbSeasons> {
  return (await getData<DbSeasons>(KEY, true)) || {};
}

export default async function upsertDbSeason(season: {
  seasonOrdinal: number;
  seasonStartTime: string;
  seasonEndTime: string;
}): Promise<void> {
  const ordinal = season?.seasonOrdinal;
  const start = parseArenaTime(season?.seasonStartTime);
  if (!ordinal || !start) return;

  const stored = await getDbSeasons();
  const next: DbSeason = {
    ordinal,
    start,
    end: parseArenaTime(season.seasonEndTime),
  };

  const existing = stored[ordinal];
  if (existing && existing.start === next.start && existing.end === next.end) {
    return;
  }

  stored[ordinal] = next;
  await putData<DbSeasons>(KEY, stored, true);

  reduxAction(store.dispatch, { type: "SET_SEASONS", arg: stored });
}
