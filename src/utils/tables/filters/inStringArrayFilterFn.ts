/* eslint-disable no-bitwise */
import _ from "lodash";
import { InStringArrayFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function inStringArrayFilterFn<D>(
  rows: D[],
  filterValue: InStringArrayFilter,
  key: FilterKeys<D, string[]>
): D[] {
  const F = filterValue.value.toLowerCase();

  return rows.filter((row) => {
    const R = (row[key] as unknown as string[]).map((k) => k.toLowerCase());
    const ret = R.includes(F);

    return filterValue.not ? !ret : ret;
  });
}
