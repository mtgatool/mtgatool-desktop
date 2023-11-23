import { ToolDbNetwork } from "mtgatool-db";

import { DEFAULT_PEERS, SAVED_PEERS_KEY } from "./constants";

/* eslint-disable no-restricted-globals */
export default function removeHost(host: string) {
  const networkModule = self.toolDb.network as ToolDbNetwork;
  networkModule.disconnect(host);

  // Try to conenct to servers from cache
  self.toolDb.store.get(SAVED_PEERS_KEY, (err, data) => {
    let savedPeers: string[] = DEFAULT_PEERS;
    if (err) {
      console.error("Error getting saved peers from cache:", err);
    } else if (data) {
      try {
        const newPeers = JSON.parse(data);
        savedPeers = newPeers;
      } catch (_e) {
        console.error("Error parsing saved peers from cache:", _e);
      }
    }

    savedPeers = savedPeers.filter((peer) => peer !== host);

    self.toolDb.store.put(SAVED_PEERS_KEY, JSON.stringify(savedPeers), () => {
      console.log("Saved peers to cache", savedPeers);
    });
  });
}
