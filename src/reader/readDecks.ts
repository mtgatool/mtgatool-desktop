import upsertDbDecks from "../data/upsertDbDecks";
import isElectron from "../utils/electron/isElectron";
import { ReaderDecks } from "../utils/mtgaReader";

/**
 * Read the player's saved decks from MTGA memory (mtga-reader 0.1.6 readDecks).
 * Returns { count, decks: [{ name, deckId, attributes, piles }] }. Only works on
 * the Home screen — it returns an error object during a match — so callers
 * should trigger it on a menu/scene transition, never mid-game.
 */
export default function readDecks(): void {
  if (!isElectron()) return;
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const result: ReaderDecks & { error?: string } = reader.readDecks("MTGA");

  if (!result || result.error || !Array.isArray(result.decks)) return;

  upsertDbDecks(result.decks);
}
