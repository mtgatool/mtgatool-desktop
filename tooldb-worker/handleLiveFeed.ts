/* eslint-disable no-restricted-globals */
import { VerificationData } from "tool-db";

import reduxAction from "./reduxAction";

export default function handleLiveFeed(msg: VerificationData<Record<string, number>>) {
  console.log("Key Listener live feed ", msg);

  // In new tool-db, msg is VerificationData with v containing the value
  if (msg && msg.v) {
    // Merge the new data into liveFeed
    Object.keys(msg.v).forEach((key) => {
      self.globalData.liveFeed[key] = msg.v[key];
    });

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
      self.toolDb.store.get(id).then((data) => {
        if (!data) {
          self.toolDb.getData(id, false).then((match) => {
            reduxAction("SET_LIVE_FEED_MATCH", { key: id, match: match });
          });
        } else {
          try {
            const parsed = JSON.parse(data);
            reduxAction("SET_LIVE_FEED_MATCH", {
              key: id,
              match: parsed.v || parsed,
            });
          } catch (e) {
            console.warn("Error parsing live feed match data:", e);
          }
        }
      }).catch(() => {
        // If not in store, fetch from network
        self.toolDb.getData(id, false).then((match) => {
          reduxAction("SET_LIVE_FEED_MATCH", { key: id, match: match });
        });
      });
    });
  }
}
