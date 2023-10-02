/* eslint-disable no-restricted-globals */
import Automerge from "automerge";
import { base64ToBinaryDocument, CrdtMessage, PutMessage } from "mtgatool-db";

import reduxAction from "./reduxAction";

export default function handleLiveFeed(msg: CrdtMessage | PutMessage<any>) {
  console.log("Key Listener live feed ", msg);
  if (msg && msg.type === "crdt") {
    if (self.globalData.liveFeed) {
      const doc = Automerge.load<Record<string, number>>(
        base64ToBinaryDocument(msg.doc)
      );

      try {
        self.globalData.liveFeed = Automerge.merge(Automerge.init(), doc);
      } catch (e) {
        console.warn(e);
      }

      const filteredLiveFeed = Object.keys(self.globalData.liveFeed)
        .sort((a, b) => {
          if (self.globalData.liveFeed[a] > self.globalData.liveFeed[b])
            return -1;
          if (self.globalData.liveFeed[a] < self.globalData.liveFeed[b])
            return 1;
          return 0;
        })
        .slice(0, 10);

      reduxAction("SET_LIVE_FEED", filteredLiveFeed);

      // Fetch any match we dont have locally
      filteredLiveFeed.forEach((id: string) => {
        self.toolDb.store.get(id, (err, data) => {
          if (!data) {
            self.toolDb.getData(id, false).then((match) => {
              reduxAction("SET_LIVE_FEED_MATCH", { key: id, match: match });
            });
          } else {
            reduxAction("SET_LIVE_FEED_MATCH", {
              key: id,
              match: JSON.parse(data).v,
            });
          }
        });
      });
    }
  }
}
