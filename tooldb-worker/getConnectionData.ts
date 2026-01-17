/* eslint-disable no-restricted-globals */

// In the new P2P WebRTC architecture, connection data is managed differently
// The webrtc-network adapter handles peer connections automatically
export default function getConnectionData() {
  const networkModule = self.toolDb.network as any;

  // Get connected peers from the webrtc adapter
  const connectedPeers = Object.keys(networkModule?.clientToSend || {});

  const connectionData = connectedPeers.map((peerId: string) => {
    const isConnected = networkModule?.isClientConnected?.[peerId]?.() ?? false;

    return {
      peerId,
      peerData: null,
      serverPeerData: null,
      host: peerId.slice(-20), // Use last 20 chars of peerId as display name
      readyState: isConnected ? 1 : 0, // WebSocket.OPEN = 1
      isConnected,
    };
  });

  self.postMessage({ type: `CONNECTION_DATA`, value: connectionData });
}
