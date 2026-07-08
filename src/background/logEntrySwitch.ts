import postChannelMessage from "../broadcastChannel/postChannelMessage";
import LogEntry from "../types/logDecoder";
import * as Labels from "./onLabel";

/**
 * MTGA Player.log label routing.
 *
 * Wizards changed the log label format: the request/response API calls
 * ("==> Label" / "<== Label(uuid)") dropped their `Namespace_Method` /
 * `Namespace.Method` separators and bumped some versions/names
 * (e.g. Rank_GetCombinedRankInfo -> RankGetCombinedRankInfo,
 * Deck.GetDeckListsV3 -> DeckGetDeckSummariesV3). The in-match GRE stream
 * ("<ts>: Match to <id>: GreToClientEvent") kept its labels.
 *
 * Labels marked CONFIRMED were observed in a live log (2026-07). Labels
 * marked UNVERIFIED were not exercised in the captured sessions (drafts,
 * pack opening, deck submit, AI practice, ...) and are the best inference
 * from the observed naming convention — verify against a live log when those
 * actions are performed. See docs/LOG_FORMAT.md for the full mapping and
 * which data is now sourced from memory instead of the log.
 */

// eslint-disable-next-line complexity
export default function logEntrySwitch(entry: LogEntry): void {
  // console.log("logEntrySwitch", entry.arrow, entry.label, entry.json);
  if (typeof entry.json.Payload === "string") {
    try {
      const newJson = JSON.parse(entry.json.Payload);
      // eslint-disable-next-line no-param-reassign
      entry.json = newJson;
    } catch (e) {
      console.log("Log entry json parse error: ", entry.json);
      console.warn(e);
    }
  }

  switch (entry.label) {
    case "detailedLogs":
      Labels.DetailedLogs(entry);
      break;

    // CONFIRMED: was Graph_GetGraphState
    case "GraphGetGraphState":
      // We just logged in, try grabbing UUID and DisplayName
      postChannelMessage({
        type: "DAEMON_GET_PLAYER_ID",
      });
      break;

    // CONFIRMED (in-match GRE stream, unchanged)
    case "GreToClientEvent":
      Labels.GreToClient(entry);
      break;

    // CONFIRMED: was ClientToMatchServiceMessageType_ClientToGREMessage
    case "ClientToGremessage":
      Labels.ClientToMatchServiceMessageTypeClientToGREMessage(entry);
      break;

    // UNVERIFIED: was Event.GetPlayerCourseV2 (singular course)
    case "EventGetCourseV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetPlayerCourseV2(entry);
      }
      break;

    // CONFIRMED: was Rank_GetCombinedRankInfo
    case "RankGetCombinedRankInfo":
      if (entry.arrow == "<==") {
        Labels.InEventGetCombinedRankInfo(entry);
      }
      break;

    // UNVERIFIED: was Draft.Notify
    case "DraftNotify":
      Labels.InDraftNotify(entry);
      break;

    // UNVERIFIED: was Draft.MakeHumanDraftPick
    case "DraftMakeHumanDraftPick":
      if (entry.arrow == "==>") {
        Labels.outMakeHumanDraftPick(entry);
      } else if (entry.arrow == "<==") {
        Labels.InMakeHumanDraftPick(entry);
      }
      break;

    // UNVERIFIED: was Event_PlayerDraftMakePick
    case "EventPlayerDraftMakePick":
      if (entry.arrow == "==>") {
        Labels.OutPlayerDraftMakePick(entry);
      } else if (entry.arrow == "<==") {
        Labels.InPlayerDraftMakePick(entry);
      }
      break;

    // CONFIRMED (unchanged, still dotted)
    case "Client.SceneChange":
      Labels.onClientSceneChange(entry);
      break;

    // CONFIRMED (in-match GRE stream, unchanged)
    case "AuthenticateResponse":
      Labels.onAuthenticateResponse(entry);
      break;

    // UNVERIFIED: was Event.JoinPodmaking
    case "EventJoinPodmaking":
      if (entry.arrow == "==>") {
        Labels.InEventJoinPodMaking(entry);
      }
      break;

    // CONFIRMED: was Event.GetPlayerCoursesV2 (plural courses list)
    case "EventGetCoursesV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetPlayerCoursesV2(entry);
      }
      break;

    // CONFIRMED: was Deck.GetDeckListsV3
    case "DeckGetDeckSummariesV3":
      if (entry.arrow == "<==") {
        Labels.InDeckGetDeckListsV3(entry);
      }
      break;

    // CONFIRMED: was Deck.GetPreconDecks
    case "DeckGetAllPreconDecksV3":
      if (entry.arrow == "<==") {
        Labels.InDeckGetPreconDecks(entry);
      }
      break;

    // CONFIRMED: was Deck.UpdateDeckV3
    case "DeckUpsertDeckV3":
      if (entry.arrow == "<==") {
        Labels.InDeckUpdateDeckV3(entry);
      }
      break;

    // CONFIRMED: was Event_SetDeckV2
    case "EventSetDeckV3":
      if (entry.arrow == "==>") {
        Labels.OutSetDeckV2(entry);
      }
      break;

    // CONFIRMED (unchanged)
    case "StartHook":
      if (entry.arrow == "<==") {
        Labels.InStartHook(entry);
      }
      break;

    // UNVERIFIED: was Inventory.Updated (not seen in captured logs; inventory
    // is now read from memory — see docs/LOG_FORMAT.md)
    case "InventoryUpdated":
      // handler works for both out and in arrows
      Labels.InventoryUpdated(entry);
      break;

    // UNVERIFIED: was PostMatch.Update (not seen in captured logs)
    case "PostMatchUpdate":
      if (entry.arrow == "<==") {
        Labels.PostMatchUpdate(entry);
      }
      break;

    // UNVERIFIED: was PlayerInventory.GetPlayerCardsV3 (collection is now read
    // from memory; this log call was not observed)
    case "PlayerInventoryGetPlayerCardsV3":
      if (entry.arrow == "<==") {
        Labels.InPlayerInventoryGetPlayerCardsV3(entry);
      }
      break;

    // UNVERIFIED: was Progression.GetPlayerProgress
    case "ProgressionGetPlayerProgress":
      if (entry.arrow == "<==") {
        Labels.InProgressionGetPlayerProgress(entry);
      }
      break;

    // UNVERIFIED: was Event.DeckSubmitV3
    case "EventDeckSubmitV3":
      if (entry.arrow == "<==") {
        Labels.InEventDeckSubmitV3(entry);
      }
      break;

    // UNVERIFIED: was Event.AIPractice
    case "EventAIPractice":
      if (entry.arrow == "==>") {
        Labels.OutEventAIPractice(entry);
      }
      break;

    // UNVERIFIED: was DirectGame.Challenge
    case "DirectGameChallenge":
      if (entry.arrow == "==>") {
        Labels.OutDirectGameChallenge(entry);
      }
      break;

    // UNVERIFIED: was BotDraft_DraftStatus
    case "BotDraftDraftStatus":
      if (entry.arrow == "==>") {
        Labels.outBotDraftDraftStatus(entry);
      }
      if (entry.arrow == "<==") {
        Labels.InBotDraftDraftStatus(entry);
      }
      break;

    // UNVERIFIED: was BotDraft_DraftPick
    case "BotDraftDraftPick":
      if (entry.arrow == "<==") {
        Labels.InDraftMakePick(entry);
      } else {
        Labels.OutDraftMakePick(entry);
      }
      break;

    // UNVERIFIED: was Event.CompleteDraft
    case "EventCompleteDraft":
      if (entry.arrow == "<==") {
        Labels.InEventCompleteDraft(entry);
      }
      break;

    // UNVERIFIED: was Draft_CompleteDraft
    case "DraftCompleteDraft":
      if (entry.arrow == "<==") {
        Labels.InDraftCompleteDraft(entry);
      }
      break;

    // UNVERIFIED: was Event_GetActiveEvents
    case "EventGetActiveEvents":
      if (entry.arrow == "<==") {
        Labels.InEventGetActiveEvents(entry);
      }
      break;

    // CONFIRMED (in-match GRE stream, unchanged)
    case "MatchGameRoomStateChangedEvent":
      Labels.MatchGameRoomStateChangedEvent(entry);
      break;

    // CONFIRMED: was Event.GetSeasonAndRankDetail (moved to Rank namespace)
    case "RankGetSeasonAndRankDetails":
      if (entry.arrow == "<==") {
        Labels.InEventGetSeasonAndRankDetail(entry);
      }
      break;

    // UNVERIFIED: was PlayerInventory.GetRewardSchedule
    case "PlayerInventoryGetRewardSchedule":
      if (entry.arrow == "<==") {
        Labels.GetPlayerInventoryGetRewardSchedule(entry);
      }
      break;

    // CONFIRMED: was PlayerInventory.GetFormats
    case "GetFormats":
      if (entry.arrow == "<==") {
        Labels.GetPlayerInventoryGetFormats(entry);
      }
      break;

    // UNVERIFIED: was Event_GetCourses
    case "EventGetCourses":
      if (entry.arrow == "<==") {
        Labels.InEventGetCourses(entry);
      }
      break;

    default:
      break;
  }
}
