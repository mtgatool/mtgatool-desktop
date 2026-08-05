/**
 * Read a card from the database inside a component.
 *
 * Card lookup is async now — the data lives in a worker — so a component that
 * used to write `database.card(id)` in its body gets `useCard(id)` instead and
 * renders null for one frame.
 *
 * That frame is usually invisible: the client coalesces every card requested in
 * the same tick into one query, and answers from its cache immediately
 * afterwards, so a list of sixty cards is a single round trip and a re-render
 * only if it is the first time those cards have been seen. A card already in
 * the cache is returned on the first render with no flash at all.
 */
import { useEffect, useState } from "react";

import { DbCardDataV2 } from "../types";
import cardsDb from "../utils/cardsDb/cardsDbClient";

export default function useCard(
  grpId: number | undefined | null
): DbCardDataV2 | null {
  // Seed from the cache so an already-loaded card never renders as missing.
  const [card, setCard] = useState<DbCardDataV2 | null>(() =>
    grpId ? cardsDb.cachedCard(grpId) : null
  );

  useEffect(() => {
    if (!grpId) {
      setCard(null);
      return undefined;
    }

    const cached = cardsDb.cachedCard(grpId);
    if (cached) {
      setCard(cached);
      return undefined;
    }

    let cancelled = false;
    cardsDb.card(grpId).then((result) => {
      if (!cancelled) setCard(result);
    });

    return () => {
      cancelled = true;
    };
  }, [grpId]);

  return card;
}

/**
 * The same, for a list of ids. Returns them in the order given, with nulls for
 * cards that have not arrived (or do not exist) yet.
 */
export function useCards(grpIds: number[]): (DbCardDataV2 | null)[] {
  // The array identity changes on every render at most call sites, so the key
  // is what the effect actually depends on.
  const key = grpIds.join(",");

  const [cards, setCards] = useState<(DbCardDataV2 | null)[]>(() =>
    grpIds.map((id) => cardsDb.cachedCard(id))
  );

  useEffect(() => {
    let cancelled = false;
    cardsDb.cards(grpIds).then((result) => {
      if (!cancelled) setCards(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return cards;
}
