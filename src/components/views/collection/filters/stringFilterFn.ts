/* eslint-disable no-bitwise */
import _ from "lodash";

import { CardsData, StringFilter } from "../../../../types/collectionTypes";

export default function stringFilterFn(
  rows: CardsData[],
  filterValue: StringFilter,
  key: "name" | "type" | "artist"
): CardsData[] {
  return rows.filter((row) => {
    const F = filterValue.string;
    let res = false;

    res = res || row[key].toLowerCase().indexOf(F) !== -1;

    return filterValue.not ? !res : res;
  });
}
