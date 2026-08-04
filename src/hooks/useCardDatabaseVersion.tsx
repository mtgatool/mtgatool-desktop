import { useEffect, useState } from "react";

import database from "../utils/mtga/database";

/**
 * Track the loaded card metadata version, re-rendering when it changes.
 *
 * The metadata is a module singleton loaded asynchronously and nothing
 * dispatches when it lands, so anything deriving state from `database.card()`
 * inside a `useMemo` would compute once against whatever was loaded at the time
 * and never recompute.
 *
 * It must be watched for *changes*, not merely for becoming non-zero: boot loads
 * a cached copy first and only then upgrades to the freshly published release,
 * so a card printed in a recent set resolves to undefined on the first pass and
 * fine a moment later. Waiting only for the first non-zero version left Daze and
 * Chrome Mox permanently missing from the Timeless meta. The 6-hourly background
 * sync moves the version too, and is picked up the same way.
 *
 * Returns 0 until some metadata is available — treat that as "still loading".
 */
export default function useCardDatabaseVersion(): number {
  const [version, setVersion] = useState(database.version);

  useEffect(() => {
    const timer = setInterval(() => {
      setVersion((current) =>
        database.version === current ? current : database.version
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return version;
}
