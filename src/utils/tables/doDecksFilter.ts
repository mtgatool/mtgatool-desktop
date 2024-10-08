import _ from "lodash";

import { Sort } from "../../components/SortControls";
import { StatsDeck } from "../../types/dbTypes";
import { Filters } from "../../types/genericFilterTypes";
import applySort from "./applySort";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import inArrayStringFilterFn from "./filters/inArrayStringFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

export default function doDecksFilter(
  data: StatsDeck[],
  filters: Filters<StatsDeck>,
  sort: Sort<StatsDeck> = { key: "", sort: 1 }
): StatsDeck[] {
  let filteredData = data;

  filters.forEach((filter) => {
    // console.log(filter, filteredData);
    switch (filter.type) {
      case "string":
        if (filter.id === "name" || filter.id === "playerId") {
          filteredData = stringFilterFn<StatsDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "colors":
        if (filter.id === "colors") {
          filteredData = colorsBitsFilterFn<StatsDeck>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "inarraystring":
        if (
          filter.id === "name" ||
          filter.id === "playerId" ||
          filter.id === "id"
        ) {
          filteredData = inArrayStringFilterFn<StatsDeck>(
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
