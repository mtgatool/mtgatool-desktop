/**
 * Returns an object containing all keys and their inmediate given values in the form of an object.
 * @param path Gun chain path
 * @returns Object
 */
export default async function getGraphObject<T>(
  path: string
): Promise<T | undefined> {
  const base = (await window.gun.get(path).then()) as any;
  if (!base) return undefined;
  // console.log(path, base);

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
