import getLocalSetting from "../utils/getLocalSetting";
import { ReaderDeck } from "../utils/mtgaReader";
import { putData } from "./store";

export interface DbDecksData {
  decks: ReaderDeck[];
  updated: number;
}

/**
 * Persist the player's saved decks (read from MTGA memory) under the current
 * arena account. Stored for the eventual Supabase `decks` sync and a
 * saved-decks view; the current Decks view is derived from match stats, so
 * this data is captured but not yet rendered.
 */
export default async function upsertDbDecks(decks: ReaderDeck[]) {
  const uuid = getLocalSetting("playerId") || "default";
  putData<DbDecksData>(
    `${uuid}-decks`,
    { decks, updated: new Date().getTime() },
    true
  );
}
