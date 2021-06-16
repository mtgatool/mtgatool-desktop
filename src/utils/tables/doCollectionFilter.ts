import _ from "lodash";
import { CardsData, CollectionFilters } from "../../types/collectionTypes";
import { Sort } from "../../components/SortControls";
import applySort from "./applySort";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import formatFilterFn from "./filters/formatFilterFn";
import inBoolFilterFn from "./filters/inBoolFilterFn";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import rarityFilterFn from "./filters/rarityFilterFn";
import setFilterFn from "./filters/setFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

export default function doCollectionFilter(
  data: CardsData[],
  filters: CollectionFilters,
  sort: Sort<CardsData> = { key: "", sort: 1 }
): CardsData[] {
  let filteredData = data;

  filters.forEach((element) => {
    switch (element.id) {
      case "name":
        filteredData = stringFilterFn(filteredData, element.value, element.id);
        break;
      case "type":
        filteredData = stringFilterFn(filteredData, element.value, element.id);
        break;
      case "artist":
        filteredData = stringFilterFn(filteredData, element.value, element.id);
        break;
      case "format":
        filteredData = formatFilterFn(filteredData, element.value, element.id);
        break;
      case "banned":
        filteredData = formatFilterFn(filteredData, element.value, element.id);
        break;
      case "legal":
        filteredData = formatFilterFn(filteredData, element.value, element.id);
        break;
      case "suspended":
        filteredData = formatFilterFn(filteredData, element.value, element.id);
        break;
      case "is":
        filteredData = inBoolFilterFn(filteredData, element.value, "craftable");
        break;
      case "in":
        filteredData = inBoolFilterFn(filteredData, element.value, "booster");
        break;
      case "boosters":
        filteredData = inBoolFilterFn(filteredData, element.value, "booster");
        break;
      case "craftable":
        filteredData = inBoolFilterFn(filteredData, element.value, "craftable");
        break;
      case "cmc":
        filteredData = minMaxFilterFn(filteredData, element.value, element.id);
        break;
      case "owned":
        filteredData = minMaxFilterFn(filteredData, element.value, element.id);
        break;
      case "colors":
        filteredData = colorsBitsFilterFn(
          filteredData,
          element.value,
          element.id
        );
        break;
      case "rarity":
        filteredData = rarityFilterFn(filteredData, element.value, "rarityVal");
        break;
      case "set":
        filteredData = setFilterFn(filteredData, element.value, element.id);
        break;
      default:
        console.error("Unkown filter: ", element);
        break;
    }
  });

  filteredData = applySort(filteredData, sort);

  return filteredData;
}
