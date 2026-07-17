import upsertDbDecks from "../data/upsertDbDecks";
import isElectron from "../utils/electron/isElectron";
import { ReaderDecks } from "../utils/mtgaReader";

/**
 * Read the player's saved decks from MTGA memory (async on the native
 * threadpool since mtga-reader 0.1.7 — never blocks the event loop).
 * Returns { count, decks: [{ name, deckId, attributes, piles }] }. Only works on
 * the Home screen — it returns an error object during a match — so callers
 * should trigger it on a menu/scene transition, never mid-game.
 */
export default async function readDecks(): Promise<void> {
  if (!isElectron()) return;

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    const result: ReaderDecks & { error?: string } = await reader.readDecks(
      "MTGA"
    );

    if (!result || result.error || !Array.isArray(result.decks)) return;

    upsertDbDecks(result.decks);
  } catch (e) {
    console.error("readDecks failed:", e);
  }
}
