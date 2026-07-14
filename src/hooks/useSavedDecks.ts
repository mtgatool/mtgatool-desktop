import { useEffect, useState } from "react";

import { getData } from "../data/store";
import { DbDecksData } from "../data/upsertDbDecks";
import getLocalSetting from "../utils/getLocalSetting";
import { ReaderDeck } from "../utils/mtgaReader";

/**
 * The player's saved decks, read from memory (readDecks -> upsertDbDecks) and
 * stored under `${playerId}-decks` in the local KV. Returns [] until loaded.
 */
export default function useSavedDecks(): ReaderDeck[] {
  const [decks, setDecks] = useState<ReaderDeck[]>([]);

  useEffect(() => {
    const uuid = getLocalSetting("playerId") || "default";
    getData<DbDecksData>(`${uuid}-decks`, true)
      .then((data) => {
        if (data?.decks) setDecks(data.decks);
      })
      .catch(() => undefined);
  }, []);

  return decks;
}
