import { UserRootData } from "mtgatool-db";
import { useEffect, useState } from "react";

export default function useFetchPubKey(username: string) {
  const [pubKey, setPubkey] = useState<string | null>(null);

  useEffect(() => {
    window.toolDb.getData<UserRootData>(`==${username}`).then((userRoot) => {
      console.log(userRoot);
      if (userRoot) {
        setPubkey(userRoot.keys.skpub);
      }
    });
  }, [username]);

  return pubKey;
}
