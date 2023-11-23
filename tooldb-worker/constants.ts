import { sha1 } from "mtgatool-db";

/* eslint-disable import/prefer-default-export */
export const DEFAULT_PEERS: string[] = [
  "ccdde0f639db3ccb18ed2d48ed405323eac3ce86762923c1010796433e9a392dec3771400f524d4f0a466c0701cad99bbd8b509df3a467c8ca76fab7dc5504bb",
];

export const SAVED_PEERS_KEY = sha1("-.saved-peers.-");

export const SERVERS_KEY = sha1("-.servers.-");
