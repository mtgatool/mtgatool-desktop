/* eslint-disable prefer-destructuring */
/* eslint-disable radix */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-case-declarations */
/* eslint-disable complexity */
import _ from "lodash";
import { constants, Colors } from "mtgatool-shared";

import {
  ParsedToken,
  QueryKeys,
  RARITY_COMMON,
  RARITY_LAND,
  RARITY_MYTHIC,
  RARITY_RARE,
  RARITY_TOKEN,
  RARITY_UNCOMMON,
  CardsData,
} from "../../../types/collectionTypes";
import { FilterModes, QuerySeparators } from "../../../types/filterTypes";
import {
  AllFilters,
  ArrayFilterType,
  ColorBitsFilterType,
  Filters,
  InBoolFilterType,
  MinMaxFilterType,
  RarityBitsFilterType,
  StringFilterType,
} from "../../../types/genericFilterTypes";
import setFilter from "../../../utils/tables/filters/setFilter";

const { WHITE, BLUE, RED, BLACK, GREEN, COLORLESS } = constants;

/**
 * Matches a query string and returns an array to be used in the filters converter
 * @param filterValue Query string
 */
function parseFilterValue(filterValue: string): ParsedToken[] {
  const reg =
    /(([^\s"]+)(\b[>=|<=|:|=|!=|>|<]{1,2})([^\s"]+))|(([^\s"]+)(\b[>=|<=|:|=|!=|>|<]{1,2})("[^"]*"))|(([^\s"]+))|(("[^"]*"+))/;
  const filterPattern = new RegExp(reg, "g");

  let match;
  const results: ParsedToken[] = [];
  while ((match = filterPattern.exec(filterValue))) {
    let token;
    let separator: QuerySeparators | undefined;
    let value;
    if (match[1]) {
      // normal
      token = match[2];
      separator = match[3] as QuerySeparators;
      value = match[4];
    } else if (match[5]) {
      // quoted
      token = match[6];
      separator = match[7] as QuerySeparators;
      value = match[8].slice(1, -1);
    } else if (match[9]) {
      // name
      token = "name";
      separator = ":";
      value = match[10];
    } else if (match[11]) {
      // quoted name
      token = "name";
      separator = ":";
      value = match[12].slice(1, -1);
    }
    if (token && separator && value) {
      results.push([token, separator, value]);
    }
  }
  return results;
}

/**
 * Returns the default filters modified with the current query such as key + separator + value
 * @param key accessor in the table
 * @param isNegative should invert the result?
 * @param separator :, <, >, >=, <=, !=, =
 * @param val value to sarch
 */
function getTokenVal(
  key: QueryKeys,
  isNegative: boolean,
  separator: QuerySeparators,
  val: string
): AllFilters<CardsData> | undefined {
  switch (key) {
    case "name":
      if (separator === "=" || separator === ":") {
        const newFilter: StringFilterType<CardsData> = {
          type: "string",
          id: "name",
          value: { string: val, not: isNegative, exact: false },
        };
        return newFilter;
      }
      break;
    case "type":
      if (separator === "=" || separator === ":") {
        const newFilter: StringFilterType<CardsData> = {
          type: "string",
          id: "type",
          value: { string: val, not: isNegative, exact: false },
        };
        return newFilter;
      }
      break;
    case "artist":
      if (separator === "=" || separator === ":") {
        const newFilter: StringFilterType<CardsData> = {
          type: "string",
          id: "artist",
          value: { string: val, not: isNegative, exact: false },
        };
        return newFilter;
      }
      break;
    case "format":
      if (separator === "=" || separator === ":") {
        const newFilter: ArrayFilterType<CardsData> = {
          type: "array",
          id: "format",
          value: { arr: val.split(","), not: isNegative, mode: ":" },
        };
        return newFilter;
      }
      break;
    case "banned":
      if (separator === "=" || separator === ":") {
        const newFilter: ArrayFilterType<CardsData> = {
          type: "array",
          id: "banned",
          value: { arr: val.split(","), not: isNegative, mode: ":" },
        };
        return newFilter;
      }
      break;
    case "suspended":
      if (separator === "=" || separator === ":") {
        const newFilter: ArrayFilterType<CardsData> = {
          type: "array",
          id: "suspended",
          value: { arr: val.split(","), not: isNegative, mode: ":" },
        };
        return newFilter;
      }
      break;
    case "is":
      if (separator === "=" || separator === ":") {
        if (val == "craftable") {
          const newFilter: InBoolFilterType<CardsData> = {
            type: "inbool",
            id: "craftable",
            value: { value: !!val, type: val, mode: ":", not: isNegative },
          };
          return newFilter;
        }
      }
      break;
    case "in":
      if (separator === "=" || separator === ":") {
        if (val == "boosters" || val == "booster") {
          const newFilter: InBoolFilterType<CardsData> = {
            type: "inbool",
            id: "booster",
            value: { value: !!val, type: val, mode: ":", not: isNegative },
          };
          return newFilter;
        }
      }
      break;
    case "set":
      const newSetFilter: ArrayFilterType<CardsData> = {
        type: "array",
        id: "setCodes",
        value: { arr: val.split(","), mode: separator, not: isNegative },
      };
      return newSetFilter;
      break;
    case "legal":
      if (separator === "=" || separator === ":") {
        const newFilter: ArrayFilterType<CardsData> = {
          type: "array",
          id: "legal",
          value: { arr: val.split(","), not: isNegative, mode: ":" },
        };
        return newFilter;
      }
      break;
    case "rarity":
      let rarity = 0;
      switch (val) {
        case "token":
        case "t":
          rarity = RARITY_TOKEN;
          break;
        case "land":
        case "l":
          rarity = RARITY_LAND;
          break;
        case "common":
        case "comon":
        case "c":
          rarity = RARITY_COMMON;
          break;
        case "uncommon":
        case "uncomon":
        case "u":
          rarity = RARITY_UNCOMMON;
          break;
        case "rare":
        case "r":
          rarity = RARITY_RARE;
          break;
        case "mythic":
        case "m":
          rarity = RARITY_MYTHIC;
          break;
        default:
          break;
      }

      const newFilter: RarityBitsFilterType<CardsData> = {
        type: "rarity",
        id: "rarityVal",
        value: { rarity, not: isNegative, mode: separator },
      };
      return newFilter;
      break;
    case "cmc":
    case "owned":
      const intVal = parseInt(val);
      let value: number | undefined;
      if (separator === "=" || separator === ":") {
        value = intVal;
        value = intVal;
      }
      if (separator === ">") value = intVal + 1;
      if (separator === "<") value = intVal - 1;
      if (separator === ">=") value = intVal;
      if (separator === "<=") value = intVal;

      if (value) {
        const minmaxFilter: MinMaxFilterType<CardsData> = {
          type: "minmax",
          id: key,
          value: { value, not: isNegative, mode: separator },
        };
        return minmaxFilter;
      }
      break;
    case "colors":
      const str = val;
      let addW = false;
      let addU = false;
      let addB = false;
      let addR = false;
      let addG = false;
      let addC = false;

      if (str == "azorious") {
        addW = true;
        addU = true;
      } else if (str == "dimir") {
        addU = true;
        addB = true;
      } else if (str == "rakdos") {
        addB = true;
        addR = true;
      } else if (str == "gruul") {
        addR = true;
        addG = true;
      } else if (str == "selesnya") {
        addW = true;
        addG = true;
      } else if (str == "orzhov") {
        addW = true;
        addB = true;
      } else if (str == "izzet") {
        addU = true;
        addR = true;
      } else if (str == "golgari") {
        addB = true;
        addG = true;
      } else if (str == "boros") {
        addW = true;
        addR = true;
      } else if (str == "simic") {
        addU = true;
        addG = true;
      } else if (str == "esper") {
        addW = true;
        addU = true;
        addB = true;
      } else if (str == "grixis") {
        addU = true;
        addB = true;
        addR = true;
      } else if (str == "jund") {
        addB = true;
        addR = true;
        addG = true;
      } else if (str == "naya") {
        addW = true;
        addR = true;
        addG = true;
      } else if (str == "bant") {
        addW = true;
        addU = true;
        addG = true;
      } else if (str == "mardu") {
        addW = true;
        addB = true;
        addR = true;
      } else if (str == "temur") {
        addU = true;
        addR = true;
        addG = true;
      } else if (str == "abzan") {
        addW = true;
        addB = true;
        addG = true;
      } else if (str == "jeskai") {
        addW = true;
        addU = true;
        addR = true;
      } else if (str == "sultai") {
        addU = true;
        addB = true;
        addG = true;
      } else if (str == "white") addW = true;
      else if (str == "blue") addU = true;
      else if (str == "black") addB = true;
      else if (str == "red") addR = true;
      else if (str == "green") addG = true;
      else if (str == "colorless") addC = true;
      else {
        if (str.indexOf("w") !== -1) addW = true;
        if (str.indexOf("u") !== -1) addU = true;
        if (str.indexOf("b") !== -1) addB = true;
        if (str.indexOf("r") !== -1) addR = true;
        if (str.indexOf("g") !== -1) addG = true;
        if (str.indexOf("c") !== -1) addC = true;
      }

      const col = new Colors();
      const arr = [];
      addW && arr.push(WHITE);
      addU && arr.push(BLUE);
      addB && arr.push(BLACK);
      addR && arr.push(RED);
      addG && arr.push(GREEN);
      addC && arr.push(COLORLESS);
      col.addFromArray(arr);

      let colorMode: FilterModes = "strict";
      if (separator == "=") colorMode = "strict";
      if (separator == "!=") colorMode = "strictNot";
      if (separator == ":") colorMode = "and";
      if (separator == "<") colorMode = "strictSubset";
      if (separator == "<=") colorMode = "subset";
      if (separator == ">") colorMode = "strictSuperset";
      if (separator == ">=") colorMode = "superset";

      const minmaxFilter: ColorBitsFilterType<CardsData> = {
        type: "colors",
        id: key,
        value: { color: col.getBits(), not: isNegative, mode: colorMode },
      };
      return minmaxFilter;
      break;
    default:
      break;
  }

  return undefined;
}

const tokenToKeys: Record<string, QueryKeys | undefined> = {
  name: "name",
  t: "type",
  type: "type",
  m: "colors",
  c: "colors",
  mana: "colors",
  cmc: "cmc",
  owned: "owned",
  q: "owned",
  wanted: "wanted",
  r: "rarity",
  rarity: "rarity",
  a: "artist",
  artist: "artist",
  s: "set",
  set: "set",
  f: "format",
  is: "is",
  in: "in",
  boosters: "boosters",
  craftable: "craftable",
  legal: "legal",
  format: "format",
  banned: "banned",
  suspended: "suspended",
};

/**
 * Returns an array of filters to be used in the table based on a query string.
 * Query Syntaxt should attemp to mimic Scryfall's;
 * https://scryfall.com/docs/syntax
 * @param query query string
 */
export default function getFiltersFromQuery(query: string): Filters<CardsData> {
  let filters: Filters<CardsData> = [];
  const results = parseFilterValue(query);

  let keysAdded = 0;
  results.forEach((match) => {
    const [tokenKey, separator, tokenVal] = match;
    const isNeg = tokenKey.startsWith("-");
    const nKey = tokenKey.startsWith("-") ? tokenKey.slice(1) : tokenKey;
    const key = tokenToKeys[nKey] || undefined;
    if (key) {
      const newFilter = getTokenVal(
        key,
        isNeg,
        separator,
        tokenVal.toLowerCase()
      );

      if (newFilter) {
        filters = setFilter(filters, newFilter);
        keysAdded += 1;
      }
    }
  });

  if (keysAdded == 0) {
    filters.push({
      type: "string",
      id: "name",
      value: { string: query, not: false, exact: false },
    });
  }

  return filters;
}
