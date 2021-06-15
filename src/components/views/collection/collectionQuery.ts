/* eslint-disable radix */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-case-declarations */
/* eslint-disable complexity */
import _ from "lodash";
import { constants, Colors } from "mtgatool-shared";

import {
  CollectionFilters,
  ArrayFilter,
  ColorBitsFilter,
  InBoolFilter,
  MinMaxFilter,
  ParsedToken,
  QueryKeys,
  QuerySeparators,
  RarityBitsFilter,
  RARITY_COMMON,
  RARITY_LAND,
  RARITY_MYTHIC,
  RARITY_RARE,
  RARITY_TOKEN,
  RARITY_UNCOMMON,
  StringFilter,
  AllCollectionFilterFunctions,
} from "../../../types/collectionTypes";

const { WHITE, BLUE, RED, BLACK, GREEN, COLORLESS } = constants;

/**
 * Matches a query string and returns an array to be used in the filters converter
 * @param filterValue Query string
 */
function parseFilterValue(filterValue: string): ParsedToken[] {
  const exp = /(?<normal>(?<tok>[^\s"]+)(?<sep>\b[>=|<=|:|=|!=|>|<]{1,2})(?<val>[^\s"]+))|(?<quoted>(?<qtok>[^\s"]+)(?<qsep>\b[>=|<=|:|=|!=|>|<]{1,2})(?<qval>"[^"]*"))|(?<name>([^\s"]+))|(?<qname>("[^"]*"+))/;
  const filterPattern = new RegExp(exp, "g");

  let match;
  const results: ParsedToken[] = [];
  while ((match = filterPattern.exec(filterValue))) {
    // console.log("filterPattern match: ", match.groups);
    let token;
    let separator: QuerySeparators | undefined;
    let value;
    if (match.groups?.normal) {
      token = match.groups.tok;
      separator = match.groups.sep as QuerySeparators;
      value = match.groups.val;
    } else if (match.groups?.quoted) {
      token = match.groups.qtok;
      separator = match.groups.qsep as QuerySeparators;
      value = match.groups.qval.slice(1, -1);
    } else if (match.groups?.name) {
      token = "name";
      separator = ":";
      value = match.groups.name;
    } else if (match.groups?.qname) {
      token = "name";
      separator = ":";
      value = match.groups.qname.slice(1, -1);
    }
    if (token && separator && value) {
      results.push([token, separator, value]);
    }
  }
  return results;
}

const defaultStringFilter: StringFilter = {
  string: "",
  not: false,
};

const defaultInBoolFilter: InBoolFilter = {
  not: false,
  mode: ":",
  type: "",
  value: true,
};

const defaultMinMaxFilter: MinMaxFilter = {
  not: false,
  mode: ":",
  value: 0,
};

interface DefaultFilters
  extends Record<QueryKeys, AllCollectionFilterFunctions> {
  name: StringFilter;
  type: StringFilter;
  artist: StringFilter;
  format: StringFilter;
  banned: StringFilter;
  legal: StringFilter;
  suspended: StringFilter;
  is: InBoolFilter;
  in: InBoolFilter;
  boosters: InBoolFilter;
  craftable: InBoolFilter;
  cmc: MinMaxFilter;
  owned: MinMaxFilter;
  wanted: MinMaxFilter;
  colors: ColorBitsFilter;
  rarity: RarityBitsFilter;
  set: ArrayFilter;
}

const defaultFilters: DefaultFilters = {
  name: { ...defaultStringFilter },
  type: { ...defaultStringFilter },
  artist: { ...defaultStringFilter },
  format: { ...defaultStringFilter },
  banned: { ...defaultStringFilter },
  legal: { ...defaultStringFilter },
  suspended: { ...defaultStringFilter },
  is: { ...defaultInBoolFilter },
  in: { ...defaultInBoolFilter },
  boosters: { ...defaultInBoolFilter },
  craftable: { ...defaultInBoolFilter },
  cmc: { ...defaultMinMaxFilter },
  owned: { ...defaultMinMaxFilter },
  wanted: { ...defaultMinMaxFilter },
  colors: {
    color: 0,
    not: false,
    mode: "or",
  },
  rarity: {
    not: false,
    mode: ":",
    rarity: 0,
  },
  set: {
    arr: [],
    not: false,
    mode: ":",
  },
};

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
): DefaultFilters {
  const filters = _.cloneDeep(defaultFilters);
  switch (key) {
    case "name":
      if (separator === "=" || separator === ":") filters.name.string = val;
      filters.name.not = isNegative;
      break;
    case "type":
      if (separator === "=" || separator === ":") filters.type.string = val;
      filters.type.not = isNegative;
      break;
    case "artist":
      if (separator === "=" || separator === ":") filters.artist.string = val;
      filters.artist.not = isNegative;
      break;
    case "format":
      if (separator === "=" || separator === ":") filters.format.string = val;
      filters.format.not = isNegative;
      break;
    case "banned":
      if (separator === "=" || separator === ":") filters.banned.string = val;
      filters.banned.not = isNegative;
      break;
    case "suspended":
      if (separator === "=" || separator === ":")
        filters.suspended.string = val;
      filters.suspended.not = isNegative;
      break;
    case "is":
      if (separator === "=" || separator === ":") {
        if (val == "craftable") {
          filters.craftable.type = val;
          filters.craftable.value = !!val;
          filters.craftable.not = isNegative;
        }
      }
      break;
    case "in":
      if (separator === "=" || separator === ":") {
        if (val == "boosters" || val == "booster") {
          filters.boosters.type = "booster";
          filters.boosters.value = !!val;
          filters.boosters.not = isNegative;
        }
      }
      break;
    case "set":
      filters.set.arr = val.split(",");
      filters.set.mode = separator;
      filters.set.not = isNegative;
      break;
    case "legal":
      if (separator === "=" || separator === ":") {
        filters.legal.string = val;
        filters.legal.not = isNegative;
        // filters.format.string = val;
        // filters.suspended.string = val;
        // filters.suspended.not = true;
        // filters.banned.string = val;
        // filters.banned.not = true;
      }
      break;
    case "rarity":
      filters.rarity.not = isNegative;
      let rarity = 0;
      switch (val) {
        case "token":
          rarity = RARITY_TOKEN;
          break;
        case "land":
          rarity = RARITY_LAND;
          break;
        case "common":
          rarity = RARITY_COMMON;
          break;
        case "uncommon":
          rarity = RARITY_UNCOMMON;
          break;
        case "rare":
          rarity = RARITY_RARE;
          break;
        case "mythic":
          rarity = RARITY_MYTHIC;
          break;
        default:
          rarity = parseInt(val);
          break;
      }
      filters.rarity.mode = separator;
      filters.rarity.rarity = rarity;
      break;
    case "cmc":
      const intVal = parseInt(val);
      if (separator === "=" || separator === ":") {
        filters.cmc.value = intVal;
        filters.cmc.value = intVal;
      }
      if (separator === ">") filters.cmc.value = intVal + 1;
      if (separator === "<") filters.cmc.value = intVal - 1;
      if (separator === ">=") filters.cmc.value = intVal;
      if (separator === "<=") filters.cmc.value = intVal;
      filters.cmc.not = isNegative;
      filters.cmc.mode = separator;
      break;
    case "owned":
      const ownedVal = parseInt(val);
      if (separator === "=" || separator === ":") {
        filters.owned.value = ownedVal;
        filters.owned.value = ownedVal;
      }
      if (separator === ">") filters.owned.value = ownedVal + 1;
      if (separator === "<") filters.owned.value = ownedVal - 1;
      if (separator === ">=") filters.owned.value = ownedVal;
      if (separator === "<=") filters.owned.value = ownedVal;
      filters.owned.not = isNegative;
      filters.owned.mode = separator;
      break;
    case "wanted":
      const wantedVal = parseInt(val);
      if (separator === "=" || separator === ":") {
        filters.wanted.value = wantedVal;
        filters.wanted.value = wantedVal;
      }
      if (separator === ">") filters.wanted.value = wantedVal + 1;
      if (separator === "<") filters.wanted.value = wantedVal - 1;
      if (separator === ">=") filters.wanted.value = wantedVal;
      if (separator === "<=") filters.wanted.value = wantedVal;
      filters.wanted.not = isNegative;
      filters.wanted.mode = separator;
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
      filters.colors.color = col.getBits();
      filters.colors.not = isNegative;
      if (separator == "=") filters.colors.mode = "strict";
      if (separator == "!=") filters.colors.mode = "strictNot";
      if (separator == ":") filters.colors.mode = "and";
      if (separator == "<") filters.colors.mode = "strictSubset";
      if (separator == "<=") filters.colors.mode = "subset";
      if (separator == ">") filters.colors.mode = "strictSuperset";
      if (separator == ">=") filters.colors.mode = "superset";
      break;
    default:
      break;
  }

  return filters;
}

/**
 * Returns an array of filters to be used in the table based on a query string.
 * Query Syntaxt should attemp to mimic Scryfall's;
 * https://scryfall.com/docs/syntax
 * @param query query string
 */
export default function getFiltersFromQuery(query: string): CollectionFilters {
  const filters: CollectionFilters = [];
  const results = parseFilterValue(query);
  let keysAdded = 0;
  results.forEach((match: any) => {
    const [tokenKey, separator, tokenVal] = match;
    const isNeg = tokenKey.startsWith("-");
    const nKey = tokenKey.startsWith("-") ? tokenKey.slice(1) : tokenKey;
    const key = tokenToKeys[nKey] || undefined;
    if (key) {
      const defaultModified = getTokenVal(
        key,
        isNeg,
        separator,
        tokenVal.toLowerCase()
      );
      // console.log(defaultModified);
      Object.keys(defaultModified)
        .filter((id) => {
          return !_.isEqual(
            defaultModified[id as QueryKeys],
            defaultFilters[id as QueryKeys]
          );
        })
        .forEach((id) => {
          const typedId = id as QueryKeys;
          const newValue = defaultModified[typedId];
          keysAdded += 1;
          filters.push({ id: typedId, value: newValue } as any);
        });
    }
  });

  if (keysAdded == 0) {
    filters.push({ id: "name", value: { string: query, not: false } });
  }

  console.log(filters);
  return filters;
}

/**
 * Takes a query string and removes all key:value pairs matching the keys
 * @param query query string
 * @param key keys to remove from query
 */
export function removeFilterFromQuery(query: string, keys: string[]): string {
  const results = parseFilterValue(query);
  const newQuery: string[] = [];
  results.forEach((match: any) => {
    const [tokenKey, separator, tokenVal] = match;
    const nKey = tokenKey.startsWith("-") ? tokenKey.slice(1) : tokenKey;
    if (!keys.includes(nKey)) {
      const keyVal = `${tokenKey}${separator}${tokenVal}`;
      newQuery.push(keyVal);
    }
  });

  return newQuery.join(" ");
}
