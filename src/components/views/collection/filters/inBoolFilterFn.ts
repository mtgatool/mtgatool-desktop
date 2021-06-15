/* eslint-disable no-bitwise */
import _ from "lodash";

import { InBoolFilter, CardsData } from "../../../../types/collectionTypes";

export default function inBoolFilterFn(
  rows: CardsData[],
  filterValue: InBoolFilter,
  key: "is" | "in"
): CardsData[] {
  const F = filterValue.value;
  return rows.filter((row) => {
    const R = key == "is" ? row.craftable : row.booster;
    let ret: number | boolean = true;
    if (filterValue.mode == "=") ret = R === F;
    if (filterValue.mode == ":") ret = R === F;
    return filterValue.not ? !ret : ret;
  });
}
