/* eslint-disable no-bitwise */
import _ from "lodash";

import { BitsFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function bitsFilterFn<D>(
  rows: D[],
  filterValue: BitsFilter,
  key: FilterKeys<D, number>
): D[] {
  const F = filterValue.bits;
  return rows.filter((row) => {
    const C = (row[key] as unknown) as number;

    let ret: number | boolean = true;
    if (filterValue.mode == "strict") ret = F == C;
    if (filterValue.mode == "and") ret = F & C;
    if (filterValue.mode == "or") ret = F | C;
    if (filterValue.mode == "not") ret = ~F;
    if (filterValue.mode == "strictNot") ret = F !== C;
    if (filterValue.mode == "subset") ret = (F | C) == F;
    if (filterValue.mode == "strictSubset") ret = (F | C) == F && C !== F;
    if (filterValue.mode == "superset") ret = (F & C) == F;
    if (filterValue.mode == "strictSuperset") ret = (F & C) == F && C !== F;
    return filterValue.not ? !ret : ret;
  });
}
