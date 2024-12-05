import { CARD_RARITIES } from "../constants";

export const RATING_SOURCE_MTGCSR = 0;
export const RATING_SOURCE_LOLA = 1;
export const RATING_SOURCE_LOLA_B = 2;

export interface CardSet {
  collation: number | false;
  scryfall: string;
  code: string;
  arenacode: string;
  tile: number;
  release: string;
  svg?: string;
}

export interface RewardsDate {
  daily: string;
  weekly: string;
}

export interface Format {
  name: string;
  sets: string[];
  bannedTitleIds: number[];
  suspendedTitleIds: number[];
  allowedTitleIds: number[];
  cardCountRestriction: string;
}

interface RankDataLola {
  rankSource: typeof RATING_SOURCE_LOLA | typeof RATING_SOURCE_LOLA_B;
  rank: number;
  side: boolean;
  ceil: number;
  values: number[];
}

interface RankDataMTGCSR {
  rankSource: typeof RATING_SOURCE_MTGCSR;
  rank: number;
  cont: number;
  values: number[];
}

interface RankDataNone {
  rankSource: -1;
}

export type RankData = RankDataLola | RankDataMTGCSR | RankDataNone;

export type Rarity = (typeof CARD_RARITIES)[number];

export interface DbCardDataV2 {
  GrpId: number;
  TitleId: number;
  Name: string;
  AltName: string;
  FlavorText: string;
  ArtistCredit: string;
  Rarity: Rarity;
  Set: string;
  DigitalSet: string;
  IsToken: boolean;
  IsPrimaryCard: boolean;
  IsDigitalOnly: boolean;
  IsRebalanced: boolean;
  RebalancedCardGrpId: number;
  DefunctRebalancedCardGrpId: number;
  CollectorNumber: string;
  CollectorMax: string;
  UsesSideboard: number;
  ManaCost: string[];
  Cmc: number;
  LinkedFaceType: number;
  RawFrameDetail: string;
  Power: string;
  Toughness: string;
  Colors: number[];
  ColorIdentity: number[];
  FrameColors: number[];
  Types: string;
  Subtypes: string;
  Supertypes: string;
  AbilityIds: number[];
  HiddenAbilityIds: number[];
  LinkedFaceGrpIds: number[];
  AbilityIdToLinkedTokenGrpId: Record<string, string>;
  AbilityIdToLinkedConjurations: Record<string, string>;
  AdditionalFrameDetails: string[];
  RankData: RankData;
  Reprints: number[];
}

export interface Metadata {
  cards: { [id: number]: DbCardDataV2 };
  ok: boolean;
  version: string;
  language: string;
  updated: number;
  sets: { [id: string]: CardSet };
  setNames: Record<string, string>;
  digitalSets: string[];
  abilities: { [id: number]: string };
}
