/* eslint-disable no-bitwise */
import _ from "lodash";

import { RarityBitsFilter, CardsData } from "../../../../types/collectionTypes";

export default function rarityFilterFn(
  rows: CardsData[],
  filterValue: RarityBitsFilter,
  _key: "rarityVal"
): CardsData[] {
  const F = filterValue.rarity;
  return rows.filter((row) => {
    const R = row.rarityVal;
    let ret: number | boolean = true;
    if (filterValue.mode == "=") ret = R === F;
    if (filterValue.mode == ":") ret = R & F;
    if (filterValue.mode == "!=") ret = R !== F;
    if (filterValue.mode == "<=") ret = R <= F;
    if (filterValue.mode == "<") ret = R < F;
    if (filterValue.mode == ">=") ret = R >= F;
    if (filterValue.mode == ">") ret = R > F;
    return filterValue.not ? !ret : ret;
  });
}
