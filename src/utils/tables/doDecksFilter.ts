import _ from "lodash";
import { Sort } from "../../components/SortControls";
import applySort from "./applySort";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import { Filters } from "../../types/genericFilterTypes";
import { GunDeck } from "../../types/gunTypes";

export default function doDecksFilter(
  data: GunDeck[],
  filters: Filters<GunDeck>,
  sort: Sort<GunDeck> = { key: "", sort: 1 }
): GunDeck[] {
  let filteredData = data;

  filters.forEach((filter) => {
    console.log(filter, filteredData);
    switch (filter.type) {
      case "string":
        if (filter.id === "name" || filter.id === "playerId") {
          filteredData = stringFilterFn<GunDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "minmax":
        if (filter.id === "version") {
          filteredData = minMaxFilterFn<GunDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "colors":
        if (filter.id === "colors") {
          filteredData = colorsBitsFilterFn<GunDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;

      default:
        console.error("Unkown filter: ", filter);
        break;
    }
  });

  filteredData = applySort(filteredData, sort);

  return filteredData;
}
