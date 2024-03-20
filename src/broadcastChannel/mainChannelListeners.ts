import _ from "lodash";
import { InternalDraftv2 } from "mtgatool-shared";

import { overlayTitleToId } from "../common/maps";
import { LOGIN_OK } from "../constants";
import fetchCards from "../daemon/fetchCards";
import fetchPlayerId from "../daemon/fetchPlayerId";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import setDbMatch from "../toolDb/setDbMatch";
import upsertDbCards from "../toolDb/upsertDbCards";
import upsertDbInventory from "../toolDb/upsertDbInventory";
import upsertDbLiveMatch from "../toolDb/upsertDbLiveMatch";
import upsertDbRank from "../toolDb/upsertDbRank";
import { putData } from "../toolDb/worker-wrapper";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  let logReadFinished = false;

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);
    if (logReadFinished && msg.data.type === "OVERLAY_UPDATE") {
      upsertDbLiveMatch(msg.data.value);
    }

    if (msg.data.type === "POPUP") {
      reduxAction(store.dispatch, {
        type: "SET_POPUP",
        arg: {
          text: msg.data.text,
          duration: msg.data.duration,
          time: new Date().getTime(),
        },
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
      logReadFinished = true;
      if (store.getState().renderer.loading === true) {
        reduxAction(store.dispatch, {
          type: "SET_LOGIN_STATE",
          arg: LOGIN_OK,
        });
        reduxAction(store.dispatch, {
          type: "SET_LOADING",
          arg: false,
        });
        reduxAction(store.dispatch, {
          type: "SET_READING_LOG",
          arg: false,
        });
      }
    }

    if (msg.data.type === "DAEMON_GET_PLAYER_ID") {
      fetchPlayerId();
    }

    if (msg.data.type === "SET_DETAILED_LOGS") {
      reduxAction(store.dispatch, {
        type: "SET_DETAILED_LOGS",
        arg: msg.data.value === "ENABLED",
      });
    }

    if (msg.data.type === "SET_UUID") {
      switchPlayerUUID(msg.data.value);
    }

    if (msg.data.type === "SET_UUID_DISPLAYNAME") {
      switchPlayerUUID(msg.data.value.uuid, msg.data.value.displayName);
    }

    if (msg.data.type === "LOG_CHECK") {
      globalData.lastLogCheck = new Date().getTime();
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
          reduxAction(store.dispatch, {
            type: "SET_CURRENT_DRAFT",
            arg: msg.data.value,
          });
          putData<InternalDraftv2>(
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

    if (msg.data.type === "UPSERT_DB_CARDS") {
      upsertDbCards(msg.data.value);
    }

    if (msg.data.type === "UPSERT_DB_RANK") {
      upsertDbRank(msg.data.value);
    }

    if (msg.data.type === "PLAYER_INVENTORY") {
      const inventoryData = msg.data.value;
      upsertDbInventory(inventoryData);
      fetchCards();
    }

    if (msg.data.type === "UPDATE_ACTIVE_EVENTS") {
      putData("activeEvents", msg.data.value);
    }
  };
}
