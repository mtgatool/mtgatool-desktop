/* eslint-disable no-bitwise */
import _ from "lodash";
import { InBoolFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function inBoolFilterFn<D>(
  rows: D[],
  filterValue: InBoolFilter,
  key: FilterKeys<D, boolean>
): D[] {
  const F = filterValue.value;
  return rows.filter((row) => {
    const R = (row[key] as unknown) as boolean;

    // move this logic to master filter
    // R = key == "is" ? row.craftable : row.booster;

    let ret: number | boolean = true;
    if (filterValue.mode == "=") ret = R === F;
    if (filterValue.mode == ":") ret = R === F;
    return filterValue.not ? !ret : ret;
  });
}
