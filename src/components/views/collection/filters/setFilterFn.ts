/* eslint-disable no-bitwise */
import _ from "lodash";

import { CardsData, ArrayFilter } from "../../../../types/collectionTypes";

export default function setFilterFn(
  rows: CardsData[],
  filterValue: ArrayFilter,
  _key: "setCodes" | "set"
): CardsData[] {
  return rows.filter((row) => {
    const F = filterValue.arr;
    let res = false;

    F.forEach((set) => {
      res =
        res ||
        row.setCodes.includes(set) ||
        row.set.toLowerCase().indexOf(set) !== -1;
    });

    return filterValue.not ? !res : res;
  });
}
