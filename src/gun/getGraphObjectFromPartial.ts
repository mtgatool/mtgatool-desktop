import getGraphObject from "./getGraphObject";

/**
 * Returns an object containing all keys and their inmediate given values in the form of an object.
 * @param base Gun chain object
 * @returns Object
 */
export default async function getGraphObjectFromPartial<T>(
  base: Record<string, any>
): Promise<T | undefined> {
  const newObject: any = {};
  await Promise.all(
    Object.keys(base).map(async (k) => {
      if (k !== "_") {
        if (base[k]["#"]) {
          newObject[k] = await getGraphObject(base[k]["#"]);
        } else {
          newObject[k] = base[k];
        }
      }
    })
  );

  return newObject as T;
}
