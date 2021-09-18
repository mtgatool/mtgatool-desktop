export default function getLocalDbValue(db: any, key: string) {
  const val = db[key];
  if (!val && !val.v) return undefined;
  try {
    return JSON.parse(val.v).value;
  } catch (e) {
    return undefined;
  }
}
