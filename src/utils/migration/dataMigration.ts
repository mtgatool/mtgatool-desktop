/* eslint-disable no-param-reassign */
import { Deck, InternalMatch } from "mtgatool-shared";

import getLocalDbValue from "../../toolDb/getLocalDbValue";
import { DbMatch } from "../../types/dbTypes";
import getLocalSetting from "../getLocalSetting";

function convertOldInternalToDbMatch(
  match: InternalMatch
): DbMatch | undefined {
  const pDeck = new Deck(match.playerDeck);
  const oDeck = new Deck(match.oppDeck);

  const splittedId = match.id.split("-");

  // Adjust old types to have shared v2 properties
  // Not sure what other props we use from internalMatch v1 troughout the app!
  match.player.wins = (match.player as any).win;
  match.opponent.wins = (match.opponent as any).win;

  const newMatch: DbMatch = {
    playerId: splittedId[5] || getLocalSetting("playerId"),
    playerName: match.arenaId || match.player.name,
    matchId: match.id,
    playerDeckId: match.playerDeck.id,
    playerDeckHash: pDeck.getHash(),
    playerDeckColors: pDeck.getColors().getBits(),
    oppDeckColors: oDeck.getColors().getBits(),
    playerWins: match.player.wins,
    playerLosses: match.opponent.wins,
    eventId: match.eventId,
    duration: match.duration,
    internalMatch: match,
    timestamp: new Date(match.date).getTime(),
  };

  let corrupted = false;
  Object.keys(newMatch).forEach((k) => {
    if ((newMatch as any)[k] === undefined || (newMatch as any)[k] === null) {
      corrupted = true;
    }
  });

  if (newMatch.playerDeckId === "" || newMatch.duration > 3600) {
    corrupted = true;
  }

  if (corrupted) return undefined;

  return newMatch;
}

export default async function dataMigration(
  dbString: string
): Promise<DbMatch[]> {
  // I use an object to avoid possible duplicates under the same ID.
  // Nedb does not really explain how their format works so I assume
  // dupes are a possibility.

  const pubkey = window.toolDb.user?.pubKey || "";

  const promises: Promise<DbMatch | undefined>[] = dbString
    .split(`\n`)
    .map((str) => {
      return new Promise((resolve) => {
        try {
          const parsed = JSON.parse(str);
          if (parsed && parsed.type === "match") {
            const match = convertOldInternalToDbMatch(parsed);
            if (match) {
              getLocalDbValue<DbMatch>(
                `:${pubkey}.matches-${match.matchId}`
              ).then((previousMatch) => {
                if (!previousMatch) {
                  resolve(match);
                } else {
                  resolve(undefined);
                }
              });
            } else {
              resolve(undefined);
            }
          } else {
            resolve(undefined);
          }
        } catch (e) {
          resolve(undefined);
        }
      });
    });

  console.log(promises);
  return Promise.all(promises)
    .then((matches: any) => {
      console.log(matches);
      return matches.filter((m: any) => m);
    })
    .then((r) => {
      console.log(r);
      return r;
    });
}
