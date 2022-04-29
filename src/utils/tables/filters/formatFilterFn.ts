/* eslint-disable no-bitwise */
import _ from "lodash";

import { InStringArrayFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function formatFilterFn<D>(
  rows: D[],
  filterValue: InStringArrayFilter,
  key: FilterKeys<D, string[]>
): D[] {
  const F: string = filterValue.value.toLowerCase();

  if (F) {
    return rows.filter((row) => {
      const keyVal = row[key] as unknown as string[];
      const ret = keyVal.includes(F);
      return filterValue.not ? !ret : ret;
    });
  }
  return rows;
}
