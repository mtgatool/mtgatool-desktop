import { useState } from "react";

/**
 * tool-db removed: users no longer have an ECDSA public key. Kept as a no-op
 * hook so existing callers (avatars / user views) still compile. Always null.
 */
export default function useFetchPubKey(_username: string) {
  const [pubKey] = useState<string | null>(null);
  return pubKey;
}
