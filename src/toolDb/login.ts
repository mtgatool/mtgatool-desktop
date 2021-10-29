import { base64ToBinaryDocument, CrdtMessage, PutMessage } from "tool-db";
import Automerge from "automerge";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbCardsData, DbInventoryData, DbRankData } from "../types/dbTypes";
import globalData from "../utils/globalData";

function handleMatchesIndex(msg: CrdtMessage | PutMessage<any>) {
  if (msg && msg.type === "crdt") {
    // console.log("Key Listener matchesIndex ", msg);
    if (msg.type === "crdt" && globalData.matchesIndex) {
      const doc = Automerge.load<{ index: string[] }>(
        base64ToBinaryDocument(msg.doc)
      );

      globalData.matchesIndex = Automerge.merge(globalData.matchesIndex, doc);

      reduxAction(store.dispatch, {
        type: "SET_MATCHES_INDEX",
        arg: globalData.matchesIndex.index,
      });

      // Fetch any match we dont have locally
      globalData.matchesIndex.index.forEach((id: string) => {
        window.toolDb.store.get(
          window.toolDb.getUserNamespacedKey(`matches-${id}`),
          (err, data) => {
            if (!data) {
              window.toolDb.getData(`matches-${id}`, true, 2000);
            }
          }
        );
      });
      // console.log("matchesIndex", globalData.matchesIndex.index);
    }
  }
}

export function afterLogin() {
  const { dispatch } = store;

  window.toolDb.subscribeData("userids", true);
  window.toolDb.subscribeData("matchesIndex", true);
  window.toolDb.subscribeData("matches-livefeed");

  window.toolDb.addKeyListener(
    window.toolDb.getUserNamespacedKey("matchesIndex"),
    handleMatchesIndex
  );

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
