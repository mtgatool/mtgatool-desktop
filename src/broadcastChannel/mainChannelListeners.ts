import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import setGunMatch from "../gun/setGunMatch";
import upsertGunCards from "../gun/upsertGunCards";
import upsertGunDeck from "../gun/upsertGunDeck";
import upsertGunInventory from "../gun/upsertGunInventory";
import upsertGunRank from "../gun/upsertGunRank";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);

    if (msg.data.type === "LOG_MESSAGE_RECV") {
      const entry = msg.data.value as LogEntry;

      const completion = entry.position / entry.size;
      // console.log(`Log read completion: ${Math.round(completion * 100)}%`);
      if (Date.now() - last > 333) {
        last = Date.now();
        reduxAction(store.dispatch, {
          type: "SET_LOG_COMPLETION",
          arg: completion,
        });
      }
    }

    if (msg.data.type == "LOG_READ_FINISHED") {
      if (store.getState().renderer.loading === true) {
        reduxAction(store.dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_OK,
        });
        reduxAction(store.dispatch, {
          type: "SET_LOADING",
          arg: false,
        });
      }
    }

    if (msg.data.type === "SET_UUID") {
      switchPlayerUUID(msg.data.value);
    }

    if (msg.data.type === "GAME_STATS") {
      setGunMatch(msg.data.value);
    }

    if (msg.data.type === "UPSERT_GUN_DECK") {
      upsertGunDeck(msg.data.value);
    }

    if (msg.data.type === "UPSERT_GUN_CARDS") {
      upsertGunCards(msg.data.value);
    }

    if (msg.data.type === "UPSERT_GUN_RANK") {
      upsertGunRank(msg.data.value, msg.data.uuid);
    }

    if (msg.data.type === "PLAYER_INVENTORY") {
      const inventoryData = msg.data.value;
      upsertGunInventory(inventoryData);
    }
  };
}
