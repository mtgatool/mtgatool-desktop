import { base64ToBinaryDocument, CrdtMessage, PutMessage } from "tool-db";
import Automerge from "automerge";
import _ from "lodash";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbCardsData, DbInventoryData, DbRankData } from "../types/dbTypes";
import globalData from "../utils/globalData";

function handleMatchesIndex(matchesIndex: string[] | null) {
  globalData.matchesIndex = _.uniq([
    ...globalData.matchesIndex,
    ...(matchesIndex || []),
  ]);

  // Fetch any match we dont have locally
  globalData.matchesIndex.forEach((id: string) => {
    window.toolDb.store.get(id, (err, data) => {
      if (!data) {
        window.toolDb.getData(id, false, 2000);
      }
    });
  });

  reduxAction(store.dispatch, {
    type: "SET_MATCHES_INDEX",
    arg: globalData.matchesIndex,
  });
}

function handleLiveFeed(msg: CrdtMessage | PutMessage<any>) {
  // console.log("Key Listener live feed ", msg);
  if (msg && msg.type === "crdt") {
    if (globalData.liveFeed) {
      const doc = Automerge.load<Record<string, number>>(
        base64ToBinaryDocument(msg.doc)
      );

      try {
        globalData.liveFeed = Automerge.merge(Automerge.init(), doc);
      } catch (e) {
        console.warn(e);
      }

      const filteredLiveFeed = Object.keys(globalData.liveFeed)
        .sort((a, b) => {
          if (globalData.liveFeed[a] > globalData.liveFeed[b]) return -1;
          if (globalData.liveFeed[a] < globalData.liveFeed[b]) return 1;
          return 0;
        })
        .slice(0, 10);

      reduxAction(store.dispatch, {
        type: "SET_LIVE_FEED",
        arg: filteredLiveFeed,
      });

      // Fetch any match we dont have locally
      filteredLiveFeed.forEach((id: string) => {
        window.toolDb.store.get(id, (err, data) => {
          if (!data) {
            window.toolDb.getData(id, false).then((match) => {
              reduxAction(store.dispatch, {
                type: "SET_LIVE_FEED_MATCH",
                arg: { key: id, match: match },
              });
            });
          } else {
            reduxAction(store.dispatch, {
              type: "SET_LIVE_FEED_MATCH",
              arg: { key: id, match: JSON.parse(data).v },
            });
          }
        });
      });
    }
  }
}

export function afterLogin() {
  const { dispatch } = store;
  const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));

  if (window.toolDb.user) {
    window.toolDb
      .queryKeys(`:${window.toolDb.user.pubKey}.matches-`)
      .then(handleMatchesIndex);
  }

  window.toolDb.addKeyListener(
    `matches-livefeed-${currentDay}`,
    handleLiveFeed
  );

  window.toolDb.subscribeData("userids", true);
  window.toolDb.subscribeData("matchesIndex", true);

  window.toolDb.subscribeData(`matches-livefeed-${currentDay}`);

  window.toolDb
    .getData("userids", true, 5000)
    .then((data) => {
      let newest = "";
      let newestDate = 0;
      Object.keys(data).forEach((uuid) => {
        if (data[uuid] > newestDate) {
          newestDate = data[uuid];
          newest = uuid;
        }

        window.toolDb.subscribeData(`${uuid}-cards`, true);
        window.toolDb.addKeyListener<DbCardsData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-cards`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction(dispatch, {
                type: "SET_UUID_CARDS_DATA",
                arg: { cards: msg.v, uuid },
              });
            }
          }
        );

        window.toolDb.subscribeData(`${uuid}-inventory`, true);
        window.toolDb.addKeyListener<DbInventoryData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-inventory`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction(dispatch, {
                type: "SET_UUID_INVENTORY_DATA",
                arg: { inventory: msg.v, uuid },
              });
            }
          }
        );

        window.toolDb.subscribeData(`${uuid}-rank`, true);
        window.toolDb.addKeyListener<DbRankData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-rank`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction(dispatch, {
                type: "SET_UUID_RANK_DATA",
                arg: { rank: msg.v, uuid },
              });
            }
          }
        );

        reduxAction(dispatch, {
          type: "SET_UUID",
          arg: newest,
        });
      });
    })
    .catch(console.warn);
}

export default function login(username: string, password: string) {
  return window.toolDb.signIn(username, password).then((keys) => {
    afterLogin();
    return keys;
  });
}
