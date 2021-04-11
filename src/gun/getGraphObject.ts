import getGraphKeys from "./getGraphKeys";

export default async function getGraphObject<T>(ref: any): Promise<T> {
  const keys = await getGraphKeys(ref);

  const newObject: any = {};
  await Promise.all(
    keys.map(async (k) => {
      newObject[k] = await ref.get(k).then();
    })
  );

  return newObject as T;
}
