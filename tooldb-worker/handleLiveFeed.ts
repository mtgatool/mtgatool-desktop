import Automerge from "automerge";
import { base64ToBinaryDocument, CrdtMessage, PutMessage } from "mtgatool-db";

import reduxAction from "./reduxAction";

export default function handleLiveFeed(msg: CrdtMessage | PutMessage<any>) {
  // console.log("Key Listener live feed ", msg);
  if (msg && msg.type === "crdt") {
    if (window.globalData.liveFeed) {
      const doc = Automerge.load<Record<string, number>>(
        base64ToBinaryDocument(msg.doc)
      );

      try {
        window.globalData.liveFeed = Automerge.merge(Automerge.init(), doc);
      } catch (e) {
        console.warn(e);
      }

      const filteredLiveFeed = Object.keys(window.globalData.liveFeed)
        .sort((a, b) => {
          if (window.globalData.liveFeed[a] > window.globalData.liveFeed[b])
            return -1;
          if (window.globalData.liveFeed[a] < window.globalData.liveFeed[b])
            return 1;
          return 0;
        })
        .slice(0, 10);

      reduxAction("SET_LIVE_FEED", filteredLiveFeed);

      // Fetch any match we dont have locally
      filteredLiveFeed.forEach((id: string) => {
        window.toolDb.store.get(id, (err, data) => {
          if (!data) {
            window.toolDb.getData(id, false).then((match) => {
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
