export type QuerySeparators = ">=" | "<=" | ":" | "=" | "!=" | "<" | ">";

export type ParsedToken = [string, QuerySeparators, string];

export type FilterModes =
  | "strict"
  | "and"
  | "or"
  | "not"
  | "strictNot"
  | "subset"
  | "superset"
  | "strictSubset"
  | "strictSuperset";

export interface StringFilter {
  string: string;
  not: boolean;
  exact: boolean;
}

export type ColorBitsFilter = {
  color: number;
  not: boolean;
  mode: FilterModes;
};

export type BitsFilter = {
  bits: number;
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

export type InArrayStringFilter = {
  not: boolean;
  value: string[];
};

export type InStringArrayFilter = {
  not: boolean;
  value: string;
};
