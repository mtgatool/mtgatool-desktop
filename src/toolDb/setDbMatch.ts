/* eslint-disable no-param-reassign */
import _ from "lodash";
import { Deck, InternalMatch } from "mtgatool-shared";

import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import getUserNamespacedKey from "./getUserNamespacedKey";
import { putData } from "./worker-wrapper";

export default async function setDbMatch(match: InternalMatch) {
  console.log("> Set match", match);

  const { pubKey } = store.getState().renderer;

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
    pubKey: pubKey || "",
    // actionLog: match.actionLog,
  };

  // Put this match
  putData<DbMatch>(`matches-${match.id}`, newDbMatch, true);

  const remoteKey = getUserNamespacedKey(pubKey, `matches-${match.id}`);

  window.toolDbWorker.postMessage({
    type: "PUSH_DB_MATCH",
    key: remoteKey,
    match: newDbMatch,
  });

  // Create CRDT document with the new match added to it
  if (!globalData.matchesIndex.includes(remoteKey)) {
    globalData.matchesIndex.push(remoteKey);
  }

  reduxAction(store.dispatch, {
    type: "SET_MATCHES_INDEX",
    arg: globalData.matchesIndex,
  });
}
