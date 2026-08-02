/* eslint-disable no-param-reassign */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { InternalMatch } from "../types";
import { DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import Deck from "../utils/mtga/deck";
import { pushMatch } from "./cloudSync";
import { getUserNamespacedKey, putData } from "./store";

export default async function setDbMatch(
  match: InternalMatch,
  // During the initial catch-up read we save matches locally (idempotent) but
  // do NOT cloud-push each replayed match — the login reconcile (syncMatches)
  // pushes the whole backlog once. Live play passes true.
  pushToCloud = true
) {
  console.log("> Set match", match);

  const newDbMatch: DbMatch = {
    matchId: match.id,
    playerId: getLocalSetting("playerId"),
    playerDeckId: match.playerDeck.id,
    playerDeckHash: match.playerDeckHash,
    playerDeckColors: new Deck(match.playerDeck).colors.getBits(),
    oppDeckColors: new Deck(match.oppDeck).colors.getBits(),
    playerName: match.player.name,
    playerWins: match.player.wins,
    playerLosses: match.opponent.wins,
    eventId: match.eventId,
    duration: match.duration,
    internalMatch: match,
    timestamp: new Date(match.date).getTime() || new Date().getTime(),
    pubKey: "",
  };

  const storedKey = getUserNamespacedKey(`matches-${match.id}`);

  if (!globalData.matchesIndex.includes(storedKey)) {
    putData<DbMatch>(`matches-${match.id}`, newDbMatch, true);
    globalData.matchesIndex.push(storedKey);
  }

  reduxAction(store.dispatch, {
    type: "SET_LOCAL_MATCHES_INDEX",
    arg: globalData.matchesIndex,
  });

  // Mirror to Supabase (no-op offline); arena_id = the persona/playerId. When
  // the push is confirmed, reflect it in the "synced" set right away so the
  // per-match cloud icon clears immediately instead of waiting for the next
  // full syncMatches() reconcile. Runs on every call (upsert is idempotent) so
  // the manual per-match upload icon re-pushes and clears too.
  if (pushToCloud) {
    const pushed = await pushMatch(newDbMatch.playerId, newDbMatch);
    if (pushed) {
      reduxAction(store.dispatch, {
        type: "SET_REMOTE_MATCHES_INDEX",
        arg: [storedKey],
      });
    }
  }
}
