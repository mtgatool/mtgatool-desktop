import { DbCardData } from "mtgatool-shared";

export interface CardsData extends DbCardData {
  colors: number;
  colorSortVal: string;
  rankSortVal: string;
  rarityVal: number;
  setCodes: string[];
  owned: number;
  acquired: number;
  format: string[];
  banned: string[];
  legal: string[];
  suspended: string[];
  craftable: boolean;
}

export type QuerySeparators = ">=" | "<=" | ":" | "=" | "!=" | "<" | ">";

export type QueryKeys =
  | "artist"
  | "banned"
  | "colors"
  | "cmc"
  | "owned"
  | "wanted"
  | "format"
  | "is"
  | "in"
  | "boosters"
  | "craftable"
  | "name"
  | "rarity"
  | "set"
  | "type"
  | "suspended"
  | "legal";

export type ParsedToken = [string, QuerySeparators, string];

type FilterModes =
  | "strict"
  | "and"
  | "or"
  | "not"
  | "strictNot"
  | "subset"
  | "superset"
  | "strictSubset"
  | "strictSuperset";

export const RARITY_TOKEN = 1;
export const RARITY_LAND = 2;
export const RARITY_COMMON = 4;
export const RARITY_UNCOMMON = 8;
export const RARITY_RARE = 16;
export const RARITY_MYTHIC = 32;

export interface StringFilter {
  string: string;
  not: boolean;
}

export type ColorBitsFilter = {
  color: number;
  not: boolean;
  mode: FilterModes;
};

export type RarityBitsFilter = {
  not: boolean;
  mode: QuerySeparators;
  rarity: number;
};

export type ArrayFilter = {
  not: boolean;
  mode: QuerySeparators;
  arr: string[];
};

export type MinMaxFilter = {
  not: boolean;
  mode: QuerySeparators;
  value: number;
};

export type InBoolFilter = {
  not: boolean;
  mode: QuerySeparators;
  type: string;
  value: boolean;
};

export interface BaseCollectionFilter {
  id: QueryKeys;
}

export interface CollectionStringFilter extends BaseCollectionFilter {
  id: "name" | "type" | "artist" | "format" | "banned" | "legal" | "suspended";
  value: StringFilter;
}

export interface CollectionColorBitsFilter extends BaseCollectionFilter {
  id: "colors";
  value: ColorBitsFilter;
}

export interface CollectionRarityBitsFilter extends BaseCollectionFilter {
  id: "rarity";
  value: RarityBitsFilter;
}

export interface CollectionArrayFilter extends BaseCollectionFilter {
  id: "set";
  value: ArrayFilter;
}

export interface CollectionMinMaxFilter extends BaseCollectionFilter {
  id: "cmc" | "owned" | "wanted";
  value: MinMaxFilter;
}

export interface CollectionInBoolFilter extends BaseCollectionFilter {
  id: "is" | "in" | "boosters" | "craftable";
  value: InBoolFilter;
}

export type AllCollectionFilterFunctions =
  | StringFilter
  | ColorBitsFilter
  | RarityBitsFilter
  | ArrayFilter
  | MinMaxFilter
  | InBoolFilter;

export type AllCollectionFilters =
  | CollectionStringFilter
  | CollectionColorBitsFilter
  | CollectionRarityBitsFilter
  | CollectionArrayFilter
  | CollectionMinMaxFilter
  | CollectionInBoolFilter;

export type CollectionFilters = AllCollectionFilters[];
