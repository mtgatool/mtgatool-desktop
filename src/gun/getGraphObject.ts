// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
import getGraphKeys from "./getGraphKeys";

/**
 * Returns an object containing all keys and their inmediate given values in the form of an object. For references to deeper graphs it only returns the node.
 * @param ref Gun chain reference
 * @returns Object as Record<string, any>
 */
export default async function getGraphObject<T>(
  ref: IGunChainReference<T>,
  keysFilter?: string[]
): Promise<T> {
  const keys = keysFilter || (await getGraphKeys(ref));

  const newObject: any = {};
  await Promise.all(
    keys.map(async (k) => {
      newObject[k] = await (ref as any).get(k).then();
    })
  );

  return newObject as T;
}
