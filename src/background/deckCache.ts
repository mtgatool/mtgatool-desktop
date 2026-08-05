/**
 * The decks Arena has mentioned this session, by id.
 *
 * `EventAiBotMatch` names the deck it is starting with by id only — the list
 * itself is never in that payload — so the deck has to have been remembered
 * from somewhere else. Arena saves the deck immediately before, through
 * `DeckUpsertDeckV3` (it stamps `LastPlayed`), which is where these come from.
 *
 * A plain module map: a handful of decks, alive for as long as the background
 * window is, and rebuilt from the log on the next run.
 */
import Deck from "../utils/mtga/deck";

const decksById = new Map<string, Deck>();

export function cacheDeck(deck: Deck): void {
  const { id } = deck;
  if (id) decksById.set(id, deck);
}

export function getCachedDeck(id: string): Deck | undefined {
  return decksById.get(id);
}
