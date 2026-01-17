/* eslint-disable no-restricted-globals */

// In the new P2P WebRTC architecture, hosts are discovered automatically via trackers
// This function is kept for backwards compatibility but doesn't do much
export default function addHost(host: string) {
  console.log(`addHost called for ${host} - in P2P mode, peers are discovered automatically`);
  // The webrtc-network adapter handles peer discovery via WebRTC trackers and Nostr relays
}
