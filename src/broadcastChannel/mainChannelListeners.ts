import _ from "lodash";

import { overlayTitleToId } from "../common/maps";
import { LOGIN_OK } from "../constants";
import { pushDraft, pushFormatsSnapshot } from "../data/cloudSync";
import { isDraftDeleted } from "../data/deletedDrafts";
import { submitLogCapture } from "../data/logCapture";
import setDbMatch from "../data/setDbMatch";
import { getUserNamespacedKey, putData } from "../data/store";
import syncDrafts from "../data/syncDrafts";
import syncMatches from "../data/syncMatches";
import upsertDbCards from "../data/upsertDbCards";
import upsertDbInventory from "../data/upsertDbInventory";
import upsertDbRank from "../data/upsertDbRank";
import upsertDbSeason from "../data/upsertDbSeason";
import showPostMatchOverview from "../postmatch/showPostMatchOverview";
import readCards from "../reader/readCards";
import readPlayerId from "../reader/readPlayerid";
import UICheckAdmin from "../reader/uiCheckAdmin";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { InternalDraftv2 } from "../types";
import LogEntry from "../types/logDecoder";
import bcConnect from "../utils/bcConnect";
import getLocalSetting from "../utils/getLocalSetting";
import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ChannelMessage } from "./channelMessages";

/** How many reads the rolling view keeps. Comfortably more than it draws. */
const READER_READS_KEPT = 120;

export default function mainChannelListeners() {
  const channel = bcConnect() as any;

  let last = Date.now();

  // Debounces the IndexedDB upsert across DRAFT_STATUS bursts (one message per
  // pick); must outlive a single onmessage call to actually debounce.
  let draftUpsertTimeout: ReturnType<typeof setTimeout> | null = null;

  const upsertDraft = async (draft: InternalDraftv2) => {
    if (!draft.id || draft.id === "") return;
    // The user deleted this one on purpose; a full log re-import must not
    // bring it back.
    if (await isDraftDeleted(draft.id)) return;
    reduxAction(store.dispatch, {
      type: "SET_CURRENT_DRAFT",
      arg: draft,
    });
    putData<InternalDraftv2>(`draft-${draft.id}`, draft, true);
    // Keep the index current so a draft finished this session shows up in the
    // list without a relog.
    const fullKey = getUserNamespacedKey(`draft-${draft.id}`);
    if (!globalData.draftsIndex.includes(fullKey)) {
      globalData.draftsIndex = [...globalData.draftsIndex, fullKey];
      reduxAction(store.dispatch, {
        type: "SET_DRAFTS_INDEX",
        arg: globalData.draftsIndex,
      });
    }
  };

  // Reconcile matches to the cloud once we actually know the persona (arena_id).
  // Matches saved during the catch-up read before this point have no persona,
  // so syncMatches at login pushed nothing; re-run it when the persona lands.
  let syncedPersona = "";
  const syncOnPersona = (uuid: string) => {
    if (uuid && uuid !== syncedPersona) {
      syncedPersona = uuid;
      syncMatches().catch(() => undefined);
      syncDrafts().catch(() => undefined);
    }
  };

  channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
    // console.log(msg.data.type);
    // Live-match sharing was a tool-db p2p feature; removed with tool-db.

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
      readPlayerId();
    }

    if (msg.data.type === "SET_DETAILED_LOGS") {
      reduxAction(store.dispatch, {
        type: "SET_DETAILED_LOGS",
        arg: msg.data.value === "ENABLED",
      });
      UICheckAdmin();
    }

    if (msg.data.type === "SET_UUID") {
      switchPlayerUUID(msg.data.value);
      syncOnPersona(msg.data.value);
    }

    if (msg.data.type === "SET_UUID_DISPLAYNAME") {
      switchPlayerUUID(msg.data.value.uuid, msg.data.value.displayName);
      syncOnPersona(msg.data.value.uuid);
    }

    if (msg.data.type === "LOG_CHECK") {
      globalData.lastLogCheck = new Date().getTime();
    }

    // A memory read finished in the background window. Kept to a fixed tail:
    // the settings page draws a rolling window of it, and holding more would be
    // a leak in a process that stays open for hours.
    if (msg.data.type === "READER_READ") {
      globalData.readerReads.push(msg.data.value);
      if (globalData.readerReads.length > READER_READS_KEPT) {
        globalData.readerReads.splice(
          0,
          globalData.readerReads.length - READER_READS_KEPT
        );
      }
    }

    if (msg.data.type === "LOG_CAPTURE") {
      submitLogCapture(msg.data.value);
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

      // The overview is shown for bot matches too, even though those are never
      // persisted above — it reads the match handed to it here, not the
      // database, so there is nothing to exclude it from.
      showPostMatchOverview(msg.data.value);
    }

    if (msg.data.type === "DRAFT_STATUS") {
      reduxAction(store.dispatch, {
        type: "SET_DRAFT_IN_PROGRESS",
        arg: true,
      });

      const draft = msg.data.value;
      if (draftUpsertTimeout !== null) {
        clearTimeout(draftUpsertTimeout);
      }
      draftUpsertTimeout = setTimeout(() => {
        draftUpsertTimeout = null;
        upsertDraft(draft);
      }, 250);
    }

    // Same upsert as DRAFT_STATUS but without marking a draft as in progress —
    // used for post-draft additions like the submitted decklist. This is also
    // the "draft is complete" moment, so it mirrors to the cloud.
    if (msg.data.type === "DRAFT_SAVE") {
      const draft = msg.data.value;
      upsertDraft(draft);
      if (draft.id) {
        pushDraft(draft.arenaId || getLocalSetting("playerId"), draft).catch(
          () => undefined
        );
      }
    }

    // Arena's formats table, fresh off the log. Versioned by hash inside the
    // push — almost every boot this is a no-op.
    if (msg.data.type === "FORMATS_SNAPSHOT") {
      pushFormatsSnapshot(msg.data.value).catch(() => undefined);
    }

    if (msg.data.type === "DRAFT_END") {
      reduxAction(store.dispatch, {
        type: "SET_DRAFT_IN_PROGRESS",
        arg: false,
      });
      // Leaving the draft scene is the other completion signal — the deck
      // submit (DRAFT_SAVE) may come much later or never, so mirror what we
      // have now.
      const draft = store.getState().renderer.currentDraft;
      if (draft && draft.id) {
        pushDraft(draft.arenaId || getLocalSetting("playerId"), draft).catch(
          () => undefined
        );
      }
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

    if (msg.data.type === "UPSERT_DB_SEASON") {
      upsertDbSeason(msg.data.value);
    }

    if (msg.data.type === "PLAYER_INVENTORY") {
      const inventoryData = msg.data.value;
      upsertDbInventory(inventoryData);
      readCards();
    }

    if (msg.data.type === "UPDATE_ACTIVE_EVENTS") {
      putData("activeEvents", msg.data.value);
    }
  };
}
