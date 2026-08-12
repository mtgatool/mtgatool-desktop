/* eslint-disable no-param-reassign */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { InternalMatch } from "../types";
import { DbMatch } from "../types/dbTypes";
import cardsDb from "../utils/cardsDb/cardsDbClient";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import Deck from "../utils/mtga/deck";
import { pushMatch } from "./cloudSync";
import { isMatchDeleted } from "./deletedMatches";
import { getUserNamespacedKey, putData } from "./store";

export default async function setDbMatch(
  match: InternalMatch,
  // During the initial catch-up read we save matches locally (idempotent) but
  // do NOT cloud-push each replayed match — the login reconcile (syncMatches)
  // pushes the whole backlog once. Live play passes true.
  pushToCloud = true
) {
  console.log("> Set match", match);

  // The user deleted this one on purpose; a full log re-import must not bring
  // it back (nor re-push it to the cloud).
  if (await isMatchDeleted(match.id)) {
    console.log("> Skipping deleted match", match.id);
    return;
  }

  // A deck works out its colours by reading each of its cards, and reading a
  // card only answers for one already fetched. Neither place these colours are
  // derived could rely on that: the background window that saves a match never
  // renders cards, so its cache is empty and the deck came out colourless,
  // while here the cache holds whatever happened to have been viewed, so the
  // colours came out partial. Both are stored, and the decks list reads them —
  // which is why a deck could sit there with no mana symbols at all.
  //
  // Fetching the cards first is all it takes, and it belongs here because this
  // is the one place both values are written and the only one that can await.
  const playerDeck = new Deck(match.playerDeck);
  const oppDeck = new Deck(match.oppDeck);

  const deckCardIds = [playerDeck, oppDeck].flatMap((deck) => [
    ...deck.getMainboard().get(),
    ...deck.getSideboard().get(),
  ]);

  if (deckCardIds.length) {
    // Never fatal: worst case the colours are as wrong as they were before.
    await cardsDb
      .cards([...new Set(deckCardIds.map((card) => card.id))])
      .catch(() => []);
  }

  // Recomputed, not read: a deck works its colours out in its constructor, and
  // both of these were built above — before the fetch, when the cache was
  // still cold. `colors` would hand back that stale answer.
  const playerDeckColors = playerDeck.getColors().getBits();
  const oppDeckColors = oppDeck.getColors().getBits();

  // The decks list and the history rows read the colours off the decks
  // inside the match, not the ones beside it, so the stale values have to be
  // corrected too — BOTH of them: forgetting the opponent's was why history
  // rows showed no opponent colours while the column beside them was right.
  if (match.playerDeck) match.playerDeck.colors = playerDeckColors;
  if (match.oppDeck) match.oppDeck.colors = oppDeckColors;

  const newDbMatch: DbMatch = {
    matchId: match.id,
    playerId: getLocalSetting("playerId"),
    playerDeckId: match.playerDeck.id,
    playerDeckHash: match.playerDeckHash,
    playerDeckColors,
    oppDeckColors,
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
