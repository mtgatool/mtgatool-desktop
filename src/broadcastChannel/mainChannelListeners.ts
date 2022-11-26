import _ from "lodash";
import { InternalDraftv2 } from "mtgatool-shared";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";

import { overlayTitleToId } from "../common/maps";
import fetchCards from "../daemon/fetchCards";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import setDbMatch from "../toolDb/setDbMatch";
import upsertDbCards from "../toolDb/upsertDbCards";
import upsertDbInventory from "../toolDb/upsertDbInventory";
import upsertDbLiveMatch from "../toolDb/upsertDbLiveMatch";
import upsertDbRank from "../toolDb/upsertDbRank";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import setLocalSetting from "../utils/setLocalSetting";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  let logReadFinished = false;

  if (electron) {
    electron.ipcRenderer.on(
      "mtgaTrackerDaemonVersion",
      (event: any, d: any) => {
        globalData.latestDaemon = d;
        if (globalData.daemon) {
          globalData.daemon.downloadLatestDaemon().finally(() => {
            if (globalData.daemon) {
              globalData.daemon.startDaemon();
            }
          });
        }
      }
    );
  }

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);

    if (msg.data.type === "DATABASE_PEERS") {
      const oldPeers = JSON.parse(getLocalSetting("peers"));
      const newPeers = _.uniqWith([...oldPeers, ...msg.data.peers], _.isEqual);

      setLocalSetting("peers", JSON.stringify(newPeers));
      console.log("Peers: ", newPeers);
      reduxAction(store.dispatch, {
        type: "SET_PEERS",
        arg: newPeers,
      });
    }

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

    if (msg.data.type === "SET_UUID") {
      switchPlayerUUID(msg.data.value);
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
      window.toolDb.putData("activeEvents", msg.data.value);
    }
  };
}
