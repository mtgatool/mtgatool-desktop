/* eslint-disable no-bitwise */
import _ from "lodash";

import { StringFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function stringFilterFn<D>(
  rows: D[],
  filterValue: StringFilter,
  key: FilterKeys<D, string>
): D[] {
  return rows.filter((row) => {
    const F = filterValue.string.toLowerCase();
    let res = false;

    const keyVal = row[key] as unknown as string;

    res = filterValue.exact
      ? keyVal.toLowerCase() === F
      : res || keyVal.toLowerCase().indexOf(F) !== -1;

    return filterValue.not ? !res : res;
  });
}
