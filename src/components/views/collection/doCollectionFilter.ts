import { CardsData, CollectionFilters } from "../../../types/collectionTypes";
import colorsBitsFilterFn from "./filters/colorsBitsFilterFn";
import formatFilterFn from "./filters/formatFilterFn";
import inBoolFilterFn from "./filters/inBoolFilterFn";
import minMaxFilterFn from "./filters/minMaxFilterFn";
import rarityFilterFn from "./filters/rarityFilterFn";
import setFilterFn from "./filters/setFilterFn";
import stringFilterFn from "./filters/stringFilterFn";

export default function doCollectionFilter(
  card: CardsData[],
  _filters: CollectionFilters
): CardsData[] {
  let filteredCards = card;

  _filters.forEach((element) => {
    switch (element.id) {
      case "name":
        filteredCards = stringFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "type":
        filteredCards = stringFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "artist":
        filteredCards = stringFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "format":
        filteredCards = formatFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "banned":
        filteredCards = formatFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "legal":
        filteredCards = formatFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "suspended":
        filteredCards = formatFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "is":
        filteredCards = inBoolFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "in":
        filteredCards = inBoolFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "boosters":
        filteredCards = inBoolFilterFn(filteredCards, element.value, "in");
        break;
      case "craftable":
        filteredCards = inBoolFilterFn(filteredCards, element.value, "is");
        break;
      case "cmc":
        filteredCards = minMaxFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "owned":
        filteredCards = minMaxFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "colors":
        filteredCards = colorsBitsFilterFn(
          filteredCards,
          element.value,
          element.id
        );
        break;
      case "rarity":
        filteredCards = rarityFilterFn(
          filteredCards,
          element.value,
          "rarityVal"
        );
        break;
      case "set":
        filteredCards = setFilterFn(filteredCards, element.value, element.id);
        break;
      default:
        console.error("Unkown filter: ", element);
        break;
    }
  });

  return filteredCards;
}
