import postChannelMessage from "../broadcastChannel/postChannelMessage";
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

  switch (entry.label) {
    case "detailedLogs":
      Labels.DetailedLogs(entry);
      break;

    case "Graph_GetGraphState":
      // We just logged in, try grabbing UUID and DisplayName
      postChannelMessage({
        type: "DAEMON_GET_PLAYER_ID",
      });
      break;

    case "GreToClientEvent":
      Labels.GreToClient(entry);
      break;

    case "ClientToMatchServiceMessageType_ClientToGREMessage":
      Labels.ClientToMatchServiceMessageTypeClientToGREMessage(entry);
      break;

    case "Event.GetPlayerCourseV2":
      if (entry.arrow == "<==") {
        Labels.InEventGetPlayerCourseV2(entry);
      }
      break;

    case "Rank_GetCombinedRankInfo":
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
      if (entry.arrow == "<==") {
        Labels.InDeckGetDeckListsV3(entry);
      }
      break;

    case "Deck.GetPreconDecks":
      if (entry.arrow == "<==") {
        Labels.InDeckGetPreconDecks(entry);
      }
      break;

    case "Deck.UpdateDeckV3":
      if (entry.arrow == "<==") {
        Labels.InDeckUpdateDeckV3(entry);
      }
      break;

    case "Event_SetDeckV2":
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
      if (entry.arrow == "==>") {
        Labels.outBotDraftDraftStatus(entry);
      }
      if (entry.arrow == "<==") {
        Labels.InBotDraftDraftStatus(entry);
      }
      break;

    case "BotDraft_DraftPick":
      if (entry.arrow == "<==") {
        Labels.InDraftMakePick(entry);
      } else {
        Labels.OutDraftMakePick(entry);
      }
      break;

    case "Event.CompleteDraft":
      if (entry.arrow == "<==") {
        Labels.InEventCompleteDraft(entry);
      }
      break;

    case "Draft_CompleteDraft":
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
      if (entry.arrow == "<==") {
        Labels.GetPlayerInventoryGetFormats(entry);
      }
      break;

    case "Event_GetCourses":
      if (entry.arrow == "<==") {
        Labels.InEventGetCourses(entry);
      }
      break;

    default:
      break;
  }
}
