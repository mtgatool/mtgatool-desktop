/* eslint-disable no-bitwise */
import _ from "lodash";
import { CardsData } from "../../../types/collectionTypes";

import { ArrayFilter } from "../../../types/filterTypes";

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
        (_key === "setCodes" && row.setCodes.includes(set)) ||
        (_key === "set" && row.set.indexOf(set) !== -1);
    });

    return filterValue.not ? !res : res;
  });
}
