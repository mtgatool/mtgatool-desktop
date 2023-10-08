/* eslint-disable no-restricted-globals */
import { InternalMatch } from "mtgatool-shared/dist";

import { DbMatch } from "./dbTypes";
import getRankFilterVal from "./getRankFilterVal";

// This interface is used only to pass to the filters and sorting table
// It should be kept as simple as possible!
export interface MatchData {
  uuid: string;
  matchId: string;
  internalMatch: InternalMatch;
  playerDeckName: string;
  timestamp: number;
  duration: number;
  win: boolean;
  eventId: string;
  oppDeckColors: number;
  playerDeckColors: number;
  playerWins: number;
  playerLosses: number;
  rank: number;
}

export function convertDbMatchToData(match: DbMatch): MatchData {
  const { internalMatch } = match;
  return {
    uuid: match.playerId,
    matchId: match.matchId,
    internalMatch: match.internalMatch,
    playerDeckName: internalMatch.player.name,
    timestamp: match.timestamp,
    duration: match.duration,
    win: match.playerWins > match.playerLosses,
    eventId: match.eventId,
    playerDeckColors: match.playerDeckColors,
    oppDeckColors: match.oppDeckColors,
    playerWins: match.playerWins,
    playerLosses: match.playerLosses,
    rank: getRankFilterVal(internalMatch.player.rank),
  };
}

function getLocalData<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    self.toolDb.store.get(key, (err, data) => {
      if (err) {
        resolve(undefined);
      } else if (data) {
        try {
          const json = JSON.parse(data);
          resolve(json.v);
        } catch (_e) {
          resolve(undefined);
        }
      } else {
        resolve(undefined);
      }
    });
  });
}

export function getMatchesDataLocal(
  msgId: string,
  matchesIds: string[],
  uuid?: string
) {
  const promises = matchesIds.map((id) => {
    return getLocalData<DbMatch>(id);
  });

  Promise.all(promises)
    .then((matches) =>
      matches.filter((m) => m).map((m: any) => convertDbMatchToData(m))
    )
    .then((data) => {
      self.postMessage({
        type: `${msgId}_OK`,
        value: data.filter((m) => (uuid ? m.uuid === uuid : true)),
      });
    });
}

export function getMatchesData(
  msgId: string,
  matchesIds: string[] | null,
  uuid?: string,
  updateCallback?: (total: number, saved: number) => void
) {
  const matchesIndex = [...new Set([...(matchesIds || [])])];

  let saved = 0;
  let timeout: NodeJS.Timeout | null = null;
  let lastUpdate = new Date().getTime();

  function updateState() {
    timeout = null;

    if (updateCallback) {
      updateCallback(matchesIndex.length, saved);
    }

    if (saved === matchesIndex.length && matchesIndex.length > 0) {
      getMatchesDataLocal(msgId, matchesIndex, uuid);
    }
  }

  function debounceUpdateState() {
    if (timeout) clearTimeout(timeout);
    if (new Date().getTime() - lastUpdate > 1000) {
      lastUpdate = new Date().getTime();
      updateState();
    }
    timeout = setTimeout(updateState, 100);
  }

  // Fetch any match we dont have locally
  matchesIndex.forEach((id: string) => {
    self.toolDb.store.get(id, (err) => {
      if (!err) {
        saved += 1;
        debounceUpdateState();
      } else {
        self.toolDb.getData(id, false, 2000).finally(() => {
          saved += 1;
          debounceUpdateState();
        });
      }
    });
  });

  updateState();
}
