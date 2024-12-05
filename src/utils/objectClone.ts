export default function objectClone<K>(originalObject: K): K {
  return JSON.parse(JSON.stringify(originalObject));
}
