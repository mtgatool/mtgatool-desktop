import _ from "lodash";

import { Sort } from "../../components/SortControls";
import { ExploreDeckData } from "../../components/views/explore/doExploreAggregation";
import { Filters } from "../../types/genericFilterTypes";
import applySort from "./applySort";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

export default function doExploreFilter(
  data: ExploreDeckData[],
  filters: Filters<ExploreDeckData>,
  sort: Sort<ExploreDeckData> = { key: "", sort: 1 }
): ExploreDeckData[] {
  let filteredData = data;

  filters.forEach((filter) => {
    console.log(filter, filteredData);
    switch (filter.type) {
      case "string":
        if (filter.id === "name" || filter.id === "playerId") {
          filteredData = stringFilterFn<ExploreDeckData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "colors":
        if (filter.id === "colors" || filter.id === "ranks") {
          filteredData = colorsBitsFilterFn<ExploreDeckData>(
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
