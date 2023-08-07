export default function getUserNamespacedKey(pubKey: string, key: string) {
  return `:${pubKey || ""}.${key}`;
}
