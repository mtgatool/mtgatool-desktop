import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

export interface DeckSummary {
  DeckId: string;
  Mana: string;
  Name: string;
  Attributes: [];
  Description: string;
  DeckTileId: number;
  IsCompanionValid: boolean;
  FormatLegalities: Record<string, boolean>;
  CardBack: null;
  DeckValidationSummaries: any[];
  UnownedCards: Record<string, number>;
}

export interface FormatData {
  name: string;
  sets: string[];
  bannedTitleIds: number[];
  suspendedTitleIds: number[];
  allowedTitleIds: number[];
  cardCountRestriction: string;
  mainDeckQuota: { min: number; max: number };
  sideBoardQuota: { min: number; max: number };
  commandZoneQuota: { min: number; max: number };
}

export interface TokenDefinition {
  TokenId: string;
  ExpirationDate: string;
  TokenType: number;
  ThumbnailImageName: null;
  PrefabName: string;
  HeaderLocKey: null;
  DescriptionLocKey: string;
}

// any | is used here because we dont need these fields
export interface InventoryInfo {
  SeqId: any | number;
  Changes: any;
  Gems: number;
  Gold: number;
  TotalVaultProgress: number;
  wcTrackPosition: number;
  WildCardCommons: number;
  WildCardUnCommons: number;
  WildCardRares: number;
  WildCardMythics: number;
  DraftTokens: number;
  SealedTokens: number;
  CustomTokens: any | Record<string, number>;
  Boosters: { CollationId: number; SetCode: string; Count: number }[];
  Vouchers: any;
  Cosmetics:
    | any
    | {
        ArtStyles: {
          Type: string;
          Id: string;
          ArtId: number;
          Variant: string;
        }[];
        Avatars: { Id: string; Type: string }[];
        Pets: { Type: string; Id: string; Name: string; Variant: string }[];
        Sleeves: { Id: string; Type: string }[];
        Emotes: {
          Id: string;
          Type: string;
          Page: string;
          FlipType: string;
          Category: string;
          Treatment: string;
        }[];
      };
}

interface StartHook {
  InventoryInfo: InventoryInfo;
  DeckSummaries: DeckSummary[];
  SystemMessages: any[];
  SensitiveArt: null;
  Formats: FormatData[];
  AvailableCosmetics: any;
  PreferredCosmetics: {
    Avatar: { Id: string; Type: string };
    Sleeve: any;
    Pet: any;
    Emotes: {
      Id: string;
      Type: string;
      Page: string;
      FlipType: string;
      Category: string;
      Treatment: string;
    }[];
  };
  DeckLimit: 75;
  TokenDefinitions: TokenDefinition[];
  KillSwitchNotification: any;
  CardMetadataInfo: {
    NonCraftableCardList: number[];
    NonCollectibleCardList: number[];
    UnreleasedSets: string[];
  };
  ClientPeriodicRewards: any;
}

interface Entry extends LogEntry {
  json: StartHook;
}

export default function InStartHook(entry: Entry): void {
  const { json } = entry;

  const inventoryInfo: InventoryInfo = json.InventoryInfo;
  delete inventoryInfo.SeqId;
  delete inventoryInfo.Changes;
  delete inventoryInfo.CustomTokens;
  delete inventoryInfo.Vouchers;
  delete inventoryInfo.Cosmetics;

  postChannelMessage({
    type: "PLAYER_INVENTORY",
    value: { ...inventoryInfo },
  });
}
