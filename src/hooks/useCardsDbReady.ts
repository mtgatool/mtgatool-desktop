/**
 * Re-render when the card database finishes loading.
 *
 * The eagerly-loaded values — `database.sets`, `version`, `cardCount` — are
 * empty until the database has been fetched and handed to the worker, which is
 * well after the first paint. A component that reads them in its body gets the
 * defaults and, with nothing to tell it otherwise, keeps them forever. That is
 * how the status panel came to report "Cards database (0)" while the database
 * held 26,071 cards.
 *
 * Components that only read *cards* do not need this — useCard and useCards
 * already re-render when their cards arrive.
 */
import { useEffect, useState } from "react";

import cardsDb from "../utils/cardsDb/cardsDbClient";

export default function useCardsDbReady(): boolean {
  const [ready, setReady] = useState(cardsDb.available);

  useEffect(() => {
    if (cardsDb.available) {
      setReady(true);
      return undefined;
    }

    const listener = (): void => setReady(cardsDb.available);
    cardsDb.readyListeners.add(listener);
    // Covers the case where init settled between the first render and here.
    listener();

    return () => {
      cardsDb.readyListeners.delete(listener);
    };
  }, []);

  return ready;
}
