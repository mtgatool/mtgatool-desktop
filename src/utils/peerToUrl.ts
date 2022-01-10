import { Peer } from "../redux/slices/rendererSlice";

export const knownHosts: Record<string, string> = {
  "66.97.46.144": "api.mtgatool.com",
};

export default function peerToUrl(peer: Peer): string {
  const host = knownHosts[peer.host] ?? peer.host;
  return peer.port === 443 ? `https://${host}` : `http://${host}:${peer.port}`;
}
