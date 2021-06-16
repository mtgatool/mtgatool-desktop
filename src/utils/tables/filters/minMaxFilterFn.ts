/* eslint-disable no-bitwise */
import _ from "lodash";
import { MinMaxFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function minMaxFilterFn<D>(
  rows: D[],
  filterValue: MinMaxFilter,
  key: FilterKeys<D, number>
): D[] {
  const F = filterValue.value;
  return rows.filter((row) => {
    const R = (row[key] as unknown) as number;

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

/*
export function inArrayFilterFn<D>(
  rows: D[],
  filterValue: StringFilter,
  key: string
): D[] {
  const F = filterValue.string.toLowerCase();

  return rows.filter((row) => {
    if (row[key] !== undefined && isArray(row[key])) {
      const ret = (row[key] as Array<any>).includes(F);
      return filterValue.not ? !ret : ret;
    }
    return false;
  });
}

export function arrayFilterFn<D>(
  rows: D[],
  filterValue: ArrayFilter,
  key: string
): CardsData[] {
  const { arr, mode, not } = filterValue;
  const F = arr?.map((s) => s.toLowerCase()) || [];
  return rows.filter((row) => {
    const S: string[] = row.setCodes;

    let ret: number | boolean = true;
    if (mode == "=") ret = isEqual(S, F);
    if (mode == ":") ret = _.intersection(S, F).length !== 0;
    if (mode == "!=") ret = !isEqual(S, F);
    // Not sure how to implement these
    if (mode == "<=") ret = R <= F;
    if (mode == "<") ret = R <= F;
    if (mode == ">=") ret = R >= F;
    if (mode == ">") ret = R > F;
    return not ? !ret : ret;
  });
}
*/
