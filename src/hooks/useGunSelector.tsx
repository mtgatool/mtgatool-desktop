// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
// eslint-disable-next-line import/no-unresolved
import { AlwaysDisallowedType, ArrayAsRecord } from "gun/types/types";
import { useEffect, useState } from "react";

/**
 * Listens for updates on Gun's graph and updates on new data.
 * @param ref Gun chain reference
 * @param offOnDismount Weter or not to turn off all listeners for this ref on hook dismount.
 * @returns The graph's data
 */
export default function useGunSelector<T>(
  ref: IGunChainReference<T>,
  offOnDismount = false
): AlwaysDisallowedType<ArrayAsRecord<T>> | undefined {
  const [object, setObject] = useState<
    AlwaysDisallowedType<ArrayAsRecord<T>>
  >();

  useEffect((): any => {
    ref.on((data) => {
      setObject(data);
    });

    if (offOnDismount) {
      return () => ref.off();
    }
    return true;
  }, []);

  return object;
}
