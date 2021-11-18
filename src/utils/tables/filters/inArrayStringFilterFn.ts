/* eslint-disable no-bitwise */
import _ from "lodash";
import { InArrayStringFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function inArrayStringFilterFn<D>(
  rows: D[],
  filterValue: InArrayStringFilter,
  key: FilterKeys<D, string>
): D[] {
  const F = filterValue.value;
  return rows.filter((row) => {
    const R = row[key] as unknown as string;
    const ret = !F.includes(R);
    return filterValue.not ? !ret : ret;
  });
}
