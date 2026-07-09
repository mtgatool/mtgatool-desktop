import _ from "lodash";

import { overlayTitleToId } from "../common/maps";
import { LOGIN_OK } from "../constants";
import setDbMatch from "../data/setDbMatch";
import { putData } from "../data/store";
import syncMatches from "../data/syncMatches";
import upsertDbCards from "../data/upsertDbCards";
import upsertDbInventory from "../data/upsertDbInventory";
import upsertDbRank from "../data/upsertDbRank";
import readCards from "../reader/readCards";
import readPlayerId from "../reader/readPlayerid";
import sceneSync, { syncAll } from "../reader/sceneSync";
import UICheckAdmin from "../reader/uiCheckAdmin";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { InternalDraftv2 } from "../types";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import { pushDebug } from "../utils/debugLog";
import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();
  // The catch-up % must never go backwards. The log file grows while we read it
  // (MTGA keeps writing), so position/size isn't monotonic; clamp to the max so
  // far and reset when a new read starts (LOG_MODE -> init/reread).
  let maxCompletion = 0;

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // Surface every non-spammy channel message in the debug panel so we can
    // see what actually reaches the UI. LOG_MESSAGE_RECV / OVERLAY_UPDATE are
    // per-entry/per-frame floods, so they're skipped here.
    const mtype = msg.data.type;
    if (mtype !== "LOG_MESSAGE_RECV" && mtype !== "OVERLAY_UPDATE") {
      pushDebug(`ch: ${mtype}`);
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

      const completion = entry.size
        ? Math.min(1, entry.position / entry.size)
        : 0;
      if (completion > maxCompletion) maxCompletion = completion;
      if (Date.now() - last > 333) {
        last = Date.now();
        reduxAction(store.dispatch, {
          type: "SET_LOG_COMPLETION",
          arg: maxCompletion,
        });
      }
    }

    if (msg.data.type == "LOG_READ_FINISHED") {
      pushDebug("log read finished → syncAll (reading memory)");
      // Populate everything from memory once the log has caught up.
      syncAll().catch(() => {
        // errors are surfaced via debug log inside syncAll
      });
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
      readPlayerId().catch(() => {
        // Ignore errors from background operation
      });
    }

    if (msg.data.type === "SET_DETAILED_LOGS") {
      reduxAction(store.dispatch, {
        type: "SET_DETAILED_LOGS",
        arg: msg.data.value === "ENABLED",
      });
      UICheckAdmin().catch(() => {
        // Ignore errors from background operation
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

    // Mirror the log-reader mode (init | tail | reread) from the background so
    // the UI can show it and main-side gating (cloud push, scene-driven memory
    // reads) follows the mode.
    if (msg.data.type === "LOG_MODE") {
      // A new catch-up / re-read read restarts progress from 0.
      if (msg.data.value !== "tail") maxCompletion = 0;
      reduxAction(store.dispatch, {
        type: "SET_LOG_MODE",
        arg: msg.data.value,
      });
    }

    // A forced re-read finished: reconcile local matches to the cloud (push
    // whatever the re-parse recovered that the cloud was missing).
    if (msg.data.type === "REREAD_FINISHED") {
      pushDebug("reread finished → reconciling matches to cloud");
      syncMatches().catch(() => undefined);
    }

    if (msg.data.type === "GAME_START") {
      reduxAction(store.dispatch, {
        type: "SET_MATCH_IN_PROGRESS",
        arg: true,
      });
    }

    if (msg.data.type === "SET_SCENE") {
      const scene = msg.data.value;
      reduxAction(store.dispatch, {
        type: "SET_SCENE",
        arg: scene.toSceneName,
      });
      // Use the scene transition as a cue to read fresh data from memory
      // (decks, collection, inventory, rank) — but only while live tailing,
      // never during the init catch-up or a forced re-read (which replay old
      // scene changes we must not act on). See reader/sceneSync.
      if (store.getState().renderer.logMode === "tail") {
        sceneSync(scene.fromSceneName, scene.toSceneName);
      }
    }

    if (msg.data.type === "GAME_STATS") {
      reduxAction(store.dispatch, {
        type: "SET_MATCH_IN_PROGRESS",
        arg: false,
      });
      if (msg.data.value.eventId !== "AIBotMatch") {
        // Live (tail) matches cloud-push immediately; catch-up / re-read matches
        // save locally and are pushed later by the reconcile (syncMatches).
        setDbMatch(
          msg.data.value,
          store.getState().renderer.logMode === "tail"
        );
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
      readCards().catch(() => {
        // Ignore errors from background operation
      });
    }

    if (msg.data.type === "UPDATE_ACTIVE_EVENTS") {
      putData("activeEvents", msg.data.value);
    }
  };
}
