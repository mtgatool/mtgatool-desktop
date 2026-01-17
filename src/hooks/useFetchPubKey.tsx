import { useEffect, useState } from "react";

// Import the UserRootData type from our local definition
import { UserRootData } from "../../tooldb-worker/setPassword";

export default function useFetchPubKey(username: string) {
  const [pubKey, setPubkey] = useState<string | null>(null);

  useEffect(() => {
    window.toolDb.getData<UserRootData>(`==${username}`).then((userRoot) => {
      console.log(userRoot);
      if (userRoot) {
        // In the new architecture, keys are stored differently
        // The skpriv field contains the encrypted keys
        setPubkey(userRoot.keys.skpub || userRoot.keys.skpriv);
      }
    });
  }, [username]);

  return pubKey;
}
