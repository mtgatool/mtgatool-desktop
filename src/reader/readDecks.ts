import upsertDbDecks from "../data/upsertDbDecks";
import {
  isMemoryReadingAvailable,
  readDecks as readDecksMemory,
} from "../utils/mtgaReader";

/**
 * Read the player's saved decks from MTGA memory and persist them. Deck lists
 * are no longer emitted to the Arena log in a usable form, so memory is the
 * source (see docs/LOG_FORMAT.md).
 */
export default async function readDecks() {
  if (!isMemoryReadingAvailable()) return;

  const result = await readDecksMemory("MTGA");
  if (!result || !result.decks || result.decks.length === 0) return;

  upsertDbDecks(result.decks);
}
