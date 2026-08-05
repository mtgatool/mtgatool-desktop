/**
 * Read an ability's text inside a component.
 *
 * Abilities are fetched on demand like cards, so the first read of one is a
 * miss. Unlike a card there is no per-item promise to await here — the log
 * views ask for an ability straight from a render body — so the client batches
 * the misses and announces the batch, and this subscribes to that.
 *
 * Without the subscription an ability requested during a render never appeared
 * at all: the fetch happened, the cache filled, and nothing re-rendered to read
 * it.
 */
import { useEffect, useState } from "react";

import cardsDb from "../utils/cardsDb/cardsDbClient";

export default function useAbility(abId: number | undefined | null): string {
  // Reading through the client also schedules the fetch on a miss.
  const [text, setText] = useState<string>(() =>
    abId ? cardsDb.cachedAbility(abId) ?? "" : ""
  );

  useEffect(() => {
    if (!abId) {
      setText("");
      return undefined;
    }

    const read = (): void => {
      const value = cardsDb.cachedAbility(abId);
      if (value !== undefined) setText(value);
    };

    read();
    cardsDb.abilityListeners.add(read);
    return () => {
      cardsDb.abilityListeners.delete(read);
    };
  }, [abId]);

  return text;
}
