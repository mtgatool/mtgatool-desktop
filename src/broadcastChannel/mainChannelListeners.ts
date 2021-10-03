import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";

import { InternalDraftv2 } from "mtgatool-shared";
import { overlayTitleToId } from "../common/maps";
import setDbMatch from "../toolDb/setDbMatch";
import upsertDbCards from "../toolDb/upsertDbCards";
import upsertDbDeck from "../toolDb/upsertDbDeck";
import upsertDbInventory from "../toolDb/upsertDbInventory";
import upsertDbRank from "../toolDb/upsertDbRank";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";
import setLocalSetting from "../utils/setLocalSetting";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);

    if (msg.data.type === "DATABASE_PEERS") {
      setLocalSetting("peers", JSON.stringify(msg.data.peers));
      console.log("Peers: ", msg.data.peers);
      reduxAction(store.dispatch, {
        type: "SET_PEERS",
        arg: msg.data.peers,
      });
    }

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

    if (msg.data.type === "GAME_START") {
      reduxAction(store.dispatch, {
        type: "SET_MATCH_IN_PROGRESS",
        arg: true,
      });
    }

    if (msg.data.type === "SET_SCENE") {
      reduxAction(store.dispatch, {
        type: "SET_SCENE",
        arg: msg.data.value.toSceneName,
      });
    }

    if (msg.data.type === "GAME_STATS") {
      reduxAction(store.dispatch, {
        type: "SET_MATCH_IN_PROGRESS",
        arg: false,
      });
      if (msg.data.value.eventId !== "AIBotMatch") {
        setDbMatch(msg.data.value);
      }
    }

    if (msg.data.type === "DRAFT_STATUS") {
      reduxAction(store.dispatch, {
        type: "SET_DRAFT_IN_PROGRESS",
        arg: true,
      });
    }

    let draftUpsertTImeout = null;
    if (msg.data.type === "DRAFT_STATUS") {
      if (draftUpsertTImeout !== null) {
        clearTimeout(draftUpsertTImeout);
      }
      draftUpsertTImeout = setTimeout(() => {
        if (
          msg.data.type === "DRAFT_STATUS" &&
          msg.data.value.id &&
          msg.data.value.id !== ""
        ) {
          window.toolDb.putData<InternalDraftv2>(
            `draft-${msg.data.value.id}`,
            msg.data.value,
            true
          );
        }
      }, 250);
    }

    if (msg.data.type === "DRAFT_END") {
      reduxAction(store.dispatch, {
        type: "SET_DRAFT_IN_PROGRESS",
        arg: false,
      });
    }

    if (msg.data.type == "OVERLAY_UPDATE_BOUNDS") {
      const id = overlayTitleToId[msg.data.value.window];
      if (id !== undefined) {
        reduxAction(store.dispatch, {
          type: "SET_OVERLAY_SETTINGS",
          arg: { settings: { bounds: msg.data.value.bounds }, id: id },
        });
      }
    }

    if (msg.data.type == "OVERLAY_SET_SETTINGS") {
      const id = overlayTitleToId[msg.data.value.window];
      if (id !== undefined) {
        reduxAction(store.dispatch, {
          type: "SET_OVERLAY_SETTINGS",
          arg: { settings: { ...msg.data.value.settings }, id: id },
        });
      }
    }

    if (msg.data.type === "UPSERT_DB_DECK") {
      upsertDbDeck(msg.data.value);
    }

    if (msg.data.type === "UPSERT_DB_CARDS") {
      upsertDbCards(msg.data.value);
      reduxAction(store.dispatch, {
        type: "SET_CARDS",
        arg: msg.data.value,
      });
    }

    if (msg.data.type === "UPSERT_DB_RANK") {
      upsertDbRank(msg.data.value);
    }

    if (msg.data.type === "PLAYER_INVENTORY") {
      const inventoryData = msg.data.value;
      upsertDbInventory(inventoryData);
    }
  };
}
