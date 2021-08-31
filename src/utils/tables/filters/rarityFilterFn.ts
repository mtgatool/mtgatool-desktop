/* eslint-disable no-bitwise */
import _ from "lodash";

import { RarityBitsFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function rarityFilterFn<D>(
  rows: D[],
  filterValue: RarityBitsFilter,
  key: FilterKeys<D, number>
): D[] {
  const F = filterValue.rarity;
  return rows.filter((row) => {
    const R = row[key] as unknown as number;

    let ret: number | boolean = true;
    if (filterValue.mode == "=") ret = R === F;
    if (filterValue.mode == ":") ret = R & F;
    if (filterValue.mode == "!=") ret = R !== F;
    if (filterValue.mode == "<=") ret = R <= F;
    if (filterValue.mode == "<") ret = R < F;
    if (filterValue.mode == ">=") ret = R >= F;
    if (filterValue.mode == ">") ret = R > F;
    return filterValue.not ? !ret : ret;
  });
}
