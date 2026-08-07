/**
 * How many copies of each *card* the collection holds, counting every printing.
 *
 * Ownership is recorded per printing — one row per grpid — but Arena treats a
 * playset as a playset whichever printings it is made of. So a card you already
 * hold four of shows up as unowned on each of its other printings, which is
 * true of that printing and misleading about the card: search a reprinted card
 * and most of the results claim you do not have it.
 *
 * Grouped by TitleId, which every printing of a card shares (all eleven
 * printings of Thalia, Guardian of Thraben carry 1625), and computed in SQL
 * against the collection table rather than card by card — the grid asks for
 * this once per render, not once per card.
 */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { AppState } from "../redux/stores/rendererStore";
import cardsDb from "../utils/cardsDb/cardsDbClient";
import useCardsDbReady from "./useCardsDbReady";

const SQL = `
  SELECT c.titleid, SUM(col.owned)
    FROM collection col
    JOIN cards c ON c.grpid = col.grpid
   WHERE col.owned > 0 AND c.titleid IS NOT NULL
   GROUP BY c.titleid`;

export default function useOwnedByTitle(): Record<number, number> {
  const ready = useCardsDbReady();
  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );
  // Re-run when the collection itself changes, not merely when a component that
  // uses this re-renders.
  const cards = useSelector(
    (state: AppState) => state.mainData.uuidData[currentUUID]?.cards
  );

  const [owned, setOwned] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!ready) return undefined;

    let cancelled = false;
    cardsDb
      .query(SQL)
      .then((result) => {
        if (cancelled) return;
        const map: Record<number, number> = {};
        result.values.forEach((row) => {
          map[row[0] as number] = row[1] as number;
        });
        setOwned(map);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ready, cards]);

  return owned;
}
