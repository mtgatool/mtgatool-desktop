import { ToolDbNetwork } from "mtgatool-db";

/* eslint-disable no-restricted-globals */
export default function getConnectionData() {
  const networkModule = self.toolDb.network as ToolDbNetwork;

  const connectionData = Object.keys(networkModule.clientToSend).map(
    (peerId: string) => {
      const serverPeerData = networkModule.serverPeerData[peerId];
      const peerData = self.toolDb.peers[peerId];

      const host = peerData?.host;
      const peerHost = !host || host === "127.0.0.1" ? peerId.slice(-20) : host;

      return {
        peerId,
        peerData,
        serverPeerData: serverPeerData,
        host: serverPeerData?.name || peerHost,
        isConnected: networkModule.isClientConnected[peerId](),
      };
    }
  );

  self.postMessage({ type: `CONNECTION_DATA`, value: connectionData });
}
