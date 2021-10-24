/* eslint-disable no-param-reassign */
import _ from "lodash";
import { Deck, InternalMatch } from "mtgatool-shared";
import Automerge from "automerge";

import { DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

import pushToLiveFeed from "./pushToLivefeed";

import globalData from "../utils/globalData";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";

export default async function setDbMatch(match: InternalMatch) {
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
    // actionLog: match.actionLog,
  };

  // Put this match
  window.toolDb.putData<DbMatch>(`matches-${match.id}`, newDbMatch, true);
  pushToLiveFeed(newDbMatch);

  // Create CRDT document with the new match added to it
  const newDoc = Automerge.change(globalData.matchesIndex, (doc) => {
    if (!doc.index) {
      doc.index = [];
    }
    if (!doc.index.includes(match.id)) {
      doc.index.push(match.id);
    }
  });

  reduxAction(store.dispatch, {
    type: "SET_MATCHES_INDEX",
    arg: newDoc.index,
  });

  if (window.toolDb.user) {
    // Put the CRDT change to the database, as changes from our root document
    window.toolDb
      .putCrdt(
        `matchesIndex`,
        Automerge.getChanges(globalData.matchesIndex, newDoc),
        true
      )
      .catch(console.error);
  }
  globalData.matchesIndex = newDoc;
}
