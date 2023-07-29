/* eslint-disable no-restricted-globals */

import { ToolDb, ToolDbNetwork } from "mtgatool-db";

export const DEFAULT_PEERS: string[] = [
  "ccdde0f639db3ccb18ed2d48ed405323eac3ce86762923c1010796433e9a392dec3771400f524d4f0a466c0701cad99bbd8b509df3a467c8ca76fab7dc5504bb",
];

const toolDb = new ToolDb({
  topic: "mtgatool-db-swarm-v4",
  server: false,
});

toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));

DEFAULT_PEERS.forEach((peer) => {
  const networkModule = toolDb.network as ToolDbNetwork;
  networkModule.findServer(peer);
});

toolDb.onConnect = () => {
  toolDb.onConnect = () => {
    //
  };
};

self.onmessage = (e: any) => {
  const { type } = e.data;
};
