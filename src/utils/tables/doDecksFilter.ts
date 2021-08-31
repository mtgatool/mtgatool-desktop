import _ from "lodash";
import { Sort } from "../../components/SortControls";
import applySort from "./applySort";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import { Filters } from "../../types/genericFilterTypes";
import { DbDeck } from "../../types/dbTypes";

export default function doDecksFilter(
  data: DbDeck[],
  filters: Filters<DbDeck>,
  sort: Sort<DbDeck> = { key: "", sort: 1 }
): DbDeck[] {
  let filteredData = data;

  filters.forEach((filter) => {
    console.log(filter, filteredData);
    switch (filter.type) {
      case "string":
        if (filter.id === "name" || filter.id === "playerId") {
          filteredData = stringFilterFn<DbDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "minmax":
        if (filter.id === "version") {
          filteredData = minMaxFilterFn<DbDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "colors":
        if (filter.id === "colors") {
          filteredData = colorsBitsFilterFn<DbDeck>(
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
