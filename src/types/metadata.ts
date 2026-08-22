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
  /**
   * Whether the set has a card of its own that the collection can list, as
   * opposed to only alternate printings, basic-land art or tokens. Resolved by
   * the metadata build (v231+); absent on older databases, where consumers fall
   * back to deriving it from the card pool.
   */
  collectible?: boolean;
  /**
   * Every set code a card of this set can answer to, lowercased — the raw
   * digital codes with their sub-collation suffix ("spg-mkm"), their base, and
   * the paper/Arena codes, which disagree for Dominaria ("dom"/"dar").
   * Metadata build v231+.
   */
  aliases?: string[];
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

export type Rarity = typeof CARD_RARITIES[number];

/**
 * Where a card's art comes from on Scryfall, resolved by mtgatool-metadata.
 *
 * Arena's own (set, collector number) is not a reliable address into Scryfall:
 * for ~1300 cards there is nothing there, and for ~500 more there is a
 * different card. The metadata build re-derives the address from the card's
 * name and artist and ships the answer, so the client does not have to guess.
 */
export interface CardArt {
  /** Scryfall set code. Token sets keep their `t` prefix. */
  s: string;
  /** Collector number within that set. */
  n: string;
  /**
   * Set when the art is borrowed from a printing Arena does not ship, because
   * Scryfall has no record of the one it does. The card is right, the
   * illustration may not be the one in the game — so it is disclosed, never
   * passed off as the real thing.
   */
  sub?: 1;
}

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
  /**
   * Resolved art address. Absent when Scryfall has no printing of the card,
   * and on every database built before art resolution existed — so callers
   * must keep the old URL-derivation as a fallback.
   */
  Art?: CardArt;
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
