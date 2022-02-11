import { knownHosts } from "../constants";
import { Peer } from "../redux/slices/rendererSlice";

export function getFinalHost(host: string) {
  return knownHosts[host] || host;
}

export default function peerToUrl(peer: Peer): string {
  const host = knownHosts[peer.host] ?? peer.host;
  return peer.port === 443 ? `https://${host}` : `http://${host}:${peer.port}`;
}
