import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface ChestDescription {
  ChestDescription: {
    image1: string | null;
    image2: string | null;
    image3: string | null;
    prefab: string;
    referenceId: string;
    headerLocKey: string;
    descriptionLocKey: string;
    quantity: string;
    locParams: {
      number1: number;
    };
    availableDate: string;
  };
  Wins: number;
}

type EventFlags =
  | "IsArenaPlayModeEvent"
  | "UpdateQuests"
  | "UpdateQuests"
  | "UpdateDailyWeeklyRewards"
  | "Ranked";

type DeckSelectFormats =
  | "TraditionalStandard"
  | "DirectGame"
  | "CascadeSingleton"
  | "Historic"
  | "Timeless"
  | "TraditionalTimeless"
  | "Standard"
  | "Brawl"
  | "Draft"
  | "TraditionalHistoric";

// type on the works, not fully defined
interface ActiveEventV3 {
  InternalEventName: string;
  EventState: "Active" | null;
  EventType: "Limited" | "Constructed" | "";
  StartTime: string;
  LockedTime: string;
  ClosedTime: string;
  Flags: EventFlags[];
  PastEntries: any;
  EntryFees:
    | null
    | {
        CurrencyType: string;
        Quantity: number;
        MaxUses: number | null;
        ReferenceId: string | null;
      }[];
  EventUXInfo: {
    PublicEventName: string;
    DisplayPriority: number;
    Parameters: any;
    Group: string;
    EventBladeBehavior: string;
    DeckSelectFormat: null | DeckSelectFormats;
    Prizes: Record<string, string>;
    EventComponentData: {
      AvgQueueTimeDisplay: null | {
        Seconds: number;
      };
      BoosterPacksDisplay: null | {
        CardGrantTime: string;
        CollationIds: number[];
      };
      EmblemDisplay: null | { EmblemIDs: number[] };
      CardDisplay: null;
      CardsDisplay: null;
      LossDetailsDisplay: null | {
        Games: number;
        LossDetailsType: string;
      };
      TimerDisplay: null;
      DescriptionText: null | {
        LocKey: string;
      };
      SubtitleText: null | {
        LocKey: string;
      };
      TitleRankText: null | {
        LocKey: string;
      };
      ChestWidget: null;
      InspectPreconDecksWidget: null;
      InspectSingleDeckWidget: null;
      PreviewEventWidget: null;
      ResignWidget: null;
      SelectedDeckWidget: null | {
        DeckButtonBehavior: string;
        ShowCopyDeckButton: boolean;
      };
      ViewCardPoolWidget: null | {
        CardPool: number[];
      };
      MainButtonWidget: null;
      ByCourseObjectiveTrack: null | {
        ChestDescriptions: ChestDescription[];
      };
      CumulativeObjectiveTrack: null;
      HiddenBubblesObjectiveTrack: null;
      DraftScreenUI: null | {
        TimeoutWarnSec: number;
        TimeoutDiscoSec: number;
      };
      DirectGameUI: null | {
        DirectGameFormats: {
          DirectGameBo3: string;
          DirectGame: string;
          DirectGameBo3Limited: string;
          DirectGameLimited: string;
          DirectGameTournamentMode: string;
          DirectGameTournamentHistoric: string;
          DirectGameBrawl: string;
          DirectGameTournamentLimited: string;
        };
      };
    };
  };
}

interface Entry extends LogEntry {
  json: { Events: ActiveEventV3[] };
}

export default function InEventGetActiveEvents(entry: Entry): void {
  const { json } = entry;

  const activeEventsList = json.Events.map((e) => e.InternalEventName);

  postChannelMessage({
    type: "UPDATE_ACTIVE_EVENTS",
    value: activeEventsList,
  });
}
