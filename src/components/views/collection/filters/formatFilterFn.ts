/* eslint-disable no-bitwise */
import _ from "lodash";
import allFormats from "../../../../common/allFormats";

import { CardsData, StringFilter } from "../../../../types/collectionTypes";

export default function formatFilterFn(
  rows: CardsData[],
  filterValue: StringFilter,
  key: "format" | "banned" | "suspended" | "legal"
): CardsData[] {
  const F: string = Object.keys(allFormats).filter(
    (f) => f.toLowerCase() == filterValue.string.toLowerCase()
  )[0];

  return rows.filter((row) => {
    const ret = row[key].includes(F);
    return filterValue.not ? !ret : ret;
  });
}
