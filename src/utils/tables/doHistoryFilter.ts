import _ from "lodash";
import { Sort } from "../../components/SortControls";
import applySort from "./applySort";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import stringFilterFn from "./filters/stringFilterFn";
import { MatchData } from "../../components/views/history/getMatchesData";
import inBoolFilterFn from "./filters/inBoolFilterFn";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import { Filters } from "../../types/genericFilterTypes";
import bitsFilterFn from "./filters/bitsFilterFn";

export default function doHistoryFilter(
  data: MatchData[],
  filters: Filters<MatchData>,
  sort: Sort<MatchData> = { key: "", sort: 1 }
): MatchData[] {
  let filteredData = data;

  filters.forEach((filter) => {
    switch (filter.type) {
      case "string":
        if (filter.id === "eventId") {
          filteredData = stringFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        if (filter.id === "internalMatch") {
          filteredData = stringFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        if (filter.id === "playerDeckName") {
          filteredData = stringFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "minmax":
        if (filter.id === "duration") {
          filteredData = minMaxFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        if (filter.id === "timestamp") {
          filteredData = minMaxFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "colors":
        if (filter.id === "oppDeckColors") {
          filteredData = colorsBitsFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        if (filter.id === "playerDeckColors") {
          filteredData = colorsBitsFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "inbool":
        if (filter.id === "win") {
          filteredData = inBoolFilterFn<MatchData>(
            filteredData,
            filter.value,
            filter.id
          );
        }
        break;
      case "rank":
        if (filter.id === "rank") {
          filteredData = bitsFilterFn<MatchData>(
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
