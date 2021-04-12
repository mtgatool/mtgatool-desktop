// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
// eslint-disable-next-line import/no-unresolved
import { ArrayAsRecord } from "gun/types/types";
import { useEffect, useState } from "react";

/**
 * Listens for updates on Gun's graph and updates on new data.
 *
 * Unlike useGunSelector(), this hook retuns a full depth object without node references.
 ** Use with caution! it can be slow or evencrash on big/nested/circular objects!!
 * @param ref Gun chain reference
 * @param offOnDismount Weter or not to turn off all listeners for this ref on hook dismount.
 * @returns The graph's data
 */
export default function useGunSelectorObject<T>(
  ref: IGunChainReference<T>,
  offOnDismount = false
): ArrayAsRecord<T> | undefined {
  const [object, setObject] = useState<ArrayAsRecord<T>>();

  useEffect((): any => {
    if (ref.open) {
      ref.open((data) => setObject(data));
    }

    if (offOnDismount) {
      return () => ref.off();
    }
    return true;
  }, []);

  return object;
}
