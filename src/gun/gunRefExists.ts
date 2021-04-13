// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";

export default function gunRefExists<T>(
  ref: IGunChainReference<T>,
  timeout = 1000
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeoutRef = setTimeout(() => resolve(false), timeout);
    ref.once((ack) => {
      clearTimeout(timeoutRef);
      if (!ack) resolve(false);
      else resolve(true);
    });
  });
}
