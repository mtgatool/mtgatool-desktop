/* eslint-disable no-restricted-globals */

// In the new P2P WebRTC architecture, hosts are managed automatically
// This function is kept for backwards compatibility but doesn't do much
export default function removeHost(host: string) {
  console.log(`removeHost called for ${host} - in P2P mode, connections are managed automatically`);

  // The webrtc-network adapter handles peer connections internally
  // Manual disconnect is not typically needed as peers are discovered via trackers
  const networkModule = self.toolDb.network as any;
  if (networkModule?.close) {
    networkModule.close(host);
  }
}
