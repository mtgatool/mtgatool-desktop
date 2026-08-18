import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { claimCapturesFor, isEntryWanted } from "../data/logCapture";
import LogEntry from "../types/logDecoder";
import * as Labels from "./onLabel";

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

  // An admin-configured capture may be asking for this label (see
  // data/logCapture). Handed to the main window, which owns the cloud writes;
  // the set is empty unless a capture is running, so this is a Set miss on the
  // hot path and nothing more.
  if (isEntryWanted(entry.label, entry.arrow)) {
    const captureIds = claimCapturesFor(entry.label, entry.arrow);
    postChannelMessage({
      type: "LOG_CAPTURE",
      value: {
        captureIds,
        label: entry.label,
        hash: entry.hash,
        timestamp: entry.timestamp,
        arrow: entry.arrow,
        type: entry.type,
        // The raw text, not the parsed object: a fixture wants what Arena
        // actually wrote, and `entry.json` may have been replaced above.
        // `text` is the field the decoder sets — `jsonString` is declared but
        // never populated, so capturing it would have stored nothing at all.
        jsonString: entry.text ?? entry.jsonString,
        size: entry.size,
        position: entry.position,
      },
    });
  }

  switch (entry.label) {
    case "detailedLogs":
      Labels.DetailedLogs(entry);
      break;

    // 2026 log format dropped the Namespace_Method separators on API labels.
    // Handle both the old and new spellings so a client update either way keeps
    // working (docs/LOG_FORMAT.md). Labels whose payloads left the log entirely
    // (collection/inventory/rank/deck lists) are now read from memory instead.
    case "Graph_GetGraphState":
    case "GraphGetGraphState":
      // We just logged in, try grabbing UUID and DisplayName
      postChannelMessage({
        type: "DAEMON_GET_PLAYER_ID",
      });
      break;

    case "GreToClientEvent":
      Labels.GreToClient(entry);
      break;

    case "ClientToMatchServiceMessageType_ClientToGREMessage":
    case "ClientToGremessage":
      Labels.ClientToMatchServiceMessageTypeClientToGREMessage(entry);
      break;

    case "Event.GetPlayerCourseV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetPlayerCourseV2(entry);
      }
      break;

    case "Rank_GetCombinedRankInfo":
    case "RankGetCombinedRankInfo":
      if (entry.arrow == "<==") {
        Labels.InEventGetCombinedRankInfo(entry);
      }
      break;

    case "Draft.Notify":
      Labels.InDraftNotify(entry);
      break;

    case "Draft.MakeHumanDraftPick":
      if (entry.arrow == "==>") {
        Labels.outMakeHumanDraftPick(entry);
      } else if (entry.arrow == "<==") {
        Labels.InMakeHumanDraftPick(entry);
      }
      break;

    case "Event_PlayerDraftMakePick":
    case "EventPlayerDraftMakePick":
      if (entry.arrow == "==>") {
        Labels.OutPlayerDraftMakePick(entry);
      } else if (entry.arrow == "<==") {
        Labels.InPlayerDraftMakePick(entry);
      }
      break;

    case "Client.SceneChange":
      Labels.onClientSceneChange(entry);
      break;

    case "AuthenticateResponse":
      Labels.onAuthenticateResponse(entry);
      break;

    case "Event.JoinPodmaking":
      if (entry.arrow == "==>") {
        Labels.InEventJoinPodMaking(entry);
      }
      break;

    case "Event.GetPlayerCoursesV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetPlayerCoursesV2(entry);
      }
      break;

    case "Deck.GetDeckListsV3":
    case "DeckGetDeckSummariesV3":
      if (entry.arrow == "<==") {
        Labels.InDeckGetDeckListsV3(entry);
      }
      break;

    case "Deck.GetPreconDecks":
    case "DeckGetAllPreconDecksV3":
      if (entry.arrow == "<==") {
        Labels.InDeckGetPreconDecks(entry);
      }
      break;

    case "Deck.UpdateDeckV3":
    case "DeckUpsertDeckV3":
      if (entry.arrow == "<==") {
        Labels.InDeckUpdateDeckV3(entry);
      } else if (entry.arrow == "==>") {
        Labels.OutDeckUpsertDeckV3(entry);
      }
      break;

    case "Event_SetDeckV2":
    case "EventSetDeckV3":
      if (entry.arrow == "==>") {
        Labels.OutSetDeckV2(entry);
      }
      break;

    case "StartHook":
      if (entry.arrow == "<==") {
        Labels.InStartHook(entry);
      }
      break;

    case "Inventory.Updated":
      // handler works for both out and in arrows
      Labels.InventoryUpdated(entry);
      break;

    case "PostMatch.Update":
      if (entry.arrow == "<==") {
        Labels.PostMatchUpdate(entry);
      }
      break;

    case "PlayerInventory.GetPlayerCardsV3":
      if (entry.arrow == "<==") {
        Labels.InPlayerInventoryGetPlayerCardsV3(entry);
      }
      break;

    case "Progression.GetPlayerProgress":
      if (entry.arrow == "<==") {
        Labels.InProgressionGetPlayerProgress(entry);
      }
      break;

    case "Event.DeckSubmitV3":
      if (entry.arrow == "<==") {
        Labels.InEventDeckSubmitV3(entry);
      }
      break;

    case "Event.AIPractice":
    case "EventAiBotMatch":
      if (entry.arrow == "==>") {
        Labels.OutEventAIPractice(entry);
      }
      break;

    case "DirectGame.Challenge":
      if (entry.arrow == "==>") {
        Labels.OutDirectGameChallenge(entry);
      }
      break;

    case "BotDraft_DraftStatus":
    case "BotDraftDraftStatus":
      if (entry.arrow == "==>") {
        Labels.outBotDraftDraftStatus(entry);
      }
      if (entry.arrow == "<==") {
        Labels.InBotDraftDraftStatus(entry);
      }
      break;

    case "BotDraft_DraftPick":
    case "BotDraftDraftPick":
      if (entry.arrow == "<==") {
        Labels.InDraftMakePick(entry);
      } else {
        Labels.OutDraftMakePick(entry);
      }
      break;

    case "Event_Join":
    case "EventJoin":
      if (entry.arrow == "<==") {
        Labels.InEventJoin(entry);
      }
      break;

    case "Event.CompleteDraft":
      if (entry.arrow == "<==") {
        Labels.InEventCompleteDraft(entry);
      }
      break;

    case "Draft_CompleteDraft":
    case "DraftCompleteDraft":
      if (entry.arrow == "<==") {
        Labels.InDraftCompleteDraft(entry);
      }
      break;

    case "Event_GetActiveEvents":
      if (entry.arrow == "<==") {
        Labels.InEventGetActiveEvents(entry);
      }
      break;

    case "MatchGameRoomStateChangedEvent":
      Labels.MatchGameRoomStateChangedEvent(entry);
      break;

    case "Event.GetSeasonAndRankDetail":
    case "RankGetSeasonAndRankDetails":
      if (entry.arrow == "<==") {
        Labels.InEventGetSeasonAndRankDetail(entry);
      }
      break;

    case "PlayerInventory.GetRewardSchedule":
      if (entry.arrow == "<==") {
        Labels.GetPlayerInventoryGetRewardSchedule(entry);
      }
      break;

    case "PlayerInventory.GetFormats":
    case "GetFormats":
      if (entry.arrow == "<==") {
        Labels.GetPlayerInventoryGetFormats(entry);
      }
      break;

    case "Event_GetCourses":
    case "EventGetCoursesV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetCourses(entry);
      }
      break;

    default:
      break;
  }
}
