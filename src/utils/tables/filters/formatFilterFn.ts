/* eslint-disable no-bitwise */
import _ from "lodash";
import allFormats from "../../../common/allFormats";

import { StringFilter } from "../../../types/filterTypes";
import { FilterKeys } from "../../../types/utility";

export default function formatFilterFn<D>(
  rows: D[],
  filterValue: StringFilter,
  key: FilterKeys<D, string[]>
): D[] {
  const F: string = Object.keys(allFormats).filter(
    (f) => f.toLowerCase() == filterValue.string.toLowerCase()
  )[0];

  if (F) {
    return rows.filter((row) => {
      const keyVal = (row[key] as unknown) as string[];
      const ret = keyVal.includes(F);
      return filterValue.not ? !ret : ret;
    });
  }
  return rows;
}
