import _ from "lodash";
import { CardsData } from "../../types/collectionTypes";
import { Sort } from "../../components/SortControls";
import applySort from "./applySort";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import inStringArrayFilterFn from "./filters/inStringArrayFilterFn";
import inBoolFilterFn from "./filters/inBoolFilterFn";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import rarityFilterFn from "./filters/rarityFilterFn";
import setFilterFn from "./filters/setFilterFn";
import stringFilterFn from "./filters/stringFilterFn";
import { Filters } from "../../types/genericFilterTypes";

export default function doCollectionFilter(
  data: CardsData[],
  filters: Filters<CardsData>,
  sort: Sort<CardsData> = { key: "", sort: 1 }
): CardsData[] {
  let filteredData = data;

  filters.forEach((element) => {
    switch (element.type) {
      case "string":
        if (
          element.id === "name" ||
          element.id === "type" ||
          element.id === "artist"
        ) {
          filteredData = stringFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;
      case "instringarray":
        if (
          element.id === "format" ||
          element.id === "banned" ||
          element.id === "legal" ||
          element.id === "suspended"
        ) {
          filteredData = inStringArrayFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;
      case "inbool":
        if (element.id === "craftable" || element.id === "booster") {
          filteredData = inBoolFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;

      case "minmax":
        if (element.id === "cmc" || element.id === "owned") {
          filteredData = minMaxFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;

      case "colors":
        if (element.id === "colors") {
          filteredData = colorsBitsFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;

      case "rarity":
        if (element.id === "rarityVal") {
          filteredData = rarityFilterFn(
            filteredData,
            element.value,
            element.id
          );
        }
        break;

      case "array":
        if (element.id === "setCode") {
          filteredData = setFilterFn(filteredData, element.value, element.id);
        }
        break;

      default:
        console.error("Unkown filter: ", element);
        break;
    }
  });

  filteredData = applySort(filteredData, sort);

  return filteredData;
}
