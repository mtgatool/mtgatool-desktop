import {
  ArrayFilter,
  ColorBitsFilter,
  BitsFilter,
  MinMaxFilter,
  RarityBitsFilter,
  StringFilter,
  InBoolFilter,
  InArrayStringFilter,
  InStringArrayFilter,
} from "./filterTypes";
import { FilterKeys } from "./utility";

export type filterType =
  | "string"
  | "format"
  | "colors"
  | "rarity"
  | "bits"
  | "rank"
  | "array"
  | "set"
  | "minmax"
  | "inbool"
  | "inarraystring"
  | "instringarray";

export type FilterTypeBase = {
  type: filterType;
};

export interface StringFilterType<D> extends FilterTypeBase {
  type: "string";
  id: FilterKeys<D, string>;
  value: StringFilter;
}

export interface FormatFilterType<D> extends FilterTypeBase {
  type: "format";
  id: FilterKeys<D, string[]>;
  value: StringFilter;
}

export interface ColorBitsFilterType<D> extends FilterTypeBase {
  type: "colors";
  id: FilterKeys<D, number>;
  value: ColorBitsFilter;
}

export interface RarityBitsFilterType<D> extends FilterTypeBase {
  type: "rarity";
  id: FilterKeys<D, number>;
  value: RarityBitsFilter;
}

export interface RankBitsFilterType<D> extends FilterTypeBase {
  type: "rank";
  id: FilterKeys<D, number>;
  value: BitsFilter;
}

export interface BitsFilterType<D> extends FilterTypeBase {
  type: "bits";
  id: FilterKeys<D, number>;
  value: BitsFilter;
}

export interface ArrayFilterType<D> extends FilterTypeBase {
  type: "array";
  id: FilterKeys<D, string[]>;
  value: ArrayFilter;
}

export interface SetFilterType<D> extends FilterTypeBase {
  type: "set";
  id: FilterKeys<D, string[]>;
  value: ArrayFilter;
}

export interface MinMaxFilterType<D> extends FilterTypeBase {
  type: "minmax";
  id: FilterKeys<D, number>;
  value: MinMaxFilter;
}

export interface InBoolFilterType<D> extends FilterTypeBase {
  type: "inbool";
  id: FilterKeys<D, boolean>;
  value: InBoolFilter;
}

export interface InArrayStringFilterType<D> extends FilterTypeBase {
  type: "inarraystring";
  id: FilterKeys<D, string>;
  value: InArrayStringFilter;
}

export interface InStringArrayFilterType<D> extends FilterTypeBase {
  type: "instringarray";
  id: FilterKeys<D, string[]>;
  value: InStringArrayFilter;
}

export type AllFilterFunctions =
  | StringFilter
  | ColorBitsFilter
  | RarityBitsFilter
  | BitsFilter
  | ArrayFilter
  | MinMaxFilter
  | InBoolFilter
  | InArrayStringFilter
  | InStringArrayFilter;

export type AllFilters<D> =
  | StringFilterType<D>
  | FormatFilterType<D>
  | ColorBitsFilterType<D>
  | RarityBitsFilterType<D>
  | RankBitsFilterType<D>
  | BitsFilterType<D>
  | ArrayFilterType<D>
  | SetFilterType<D>
  | MinMaxFilterType<D>
  | InBoolFilterType<D>
  | InArrayStringFilterType<D>
  | InStringArrayFilterType<D>;

export type Filters<D> = AllFilters<D>[];
