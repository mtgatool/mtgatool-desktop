/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-expressions */
/* eslint-disable radix */
import { Colors, constants } from "mtgatool-shared";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { ReactComponent as Close } from "../../../assets/images/svg/close.svg";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import {
  RARITY_COMMON,
  RARITY_LAND,
  RARITY_MYTHIC,
  RARITY_RARE,
  RARITY_TOKEN,
  RARITY_UNCOMMON,
} from "../../../types/collectionTypes";
import {
  ArrayFilter,
  ColorBitsFilter,
  InBoolFilter,
  InStringArrayFilter,
  MinMaxFilter,
  RarityBitsFilter,
} from "../../../types/filterTypes";
import Flex from "../../Flex";
import InputContainer from "../../InputContainer";
import ManaFilter from "../../ManaFilter";
import SetsFilter from "../../SetsFilter";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import getFiltersFromQuery from "./collectionQuery";

const { WHITE, BLUE, BLACK, RED, GREEN, COLORLESS } = constants;

const colorsToKey: Record<number, string> = {
  [WHITE]: "w",
  [BLUE]: "u",
  [BLACK]: "b",
  [RED]: "r",
  [GREEN]: "g",
  [COLORLESS]: "c",
};

const colorFilterOptions: Record<string, string> = {
  "Exactly these colors": "=",
  "Any of these colors": ":",
  "Strict superset of these colors": ">",
  "These colors and more": ">=",
  "Strict subset of these colors": "<",
  "At most these colors": "<=",
  "Not these colors": "!=",
};

const formatFilterOptions = [
  "Not set",
  "Standard",
  "Historic",
  "Timeless",
  "Alchemy",
  "Explorer",
  "Brawl",
];

const raritySeparatorOptions: Record<string, string> = {
  "Equal to": ":",
  Not: "!=",
  Above: ">",
  "Equal or above": ">=",
  "Lower than": "<",
  "Lower or equal to": "<=",
};

const rarityFilterOptions = [
  "Any",
  "Token",
  "Land",
  "Common",
  "Uncommon",
  "Rare",
  "Mythic",
];

const inBoostersMode = ["All Cards", "In boosters", "Not in boosters"];

interface AdvancedSearchProps {
  closeCallback: () => void;
}

export default function AdvancedSearch(
  props: AdvancedSearchProps
): JSX.Element {
  const { closeCallback } = props;
  const history = useHistory();
  const dispatch = useDispatch();
  const collectionQuery = useSelector(
    (state: AppState) => state.renderer.collectionQuery
  );
  const defaultFilters = getFiltersFromQuery(collectionQuery);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(0);

  // Default filters
  let defaultCol = 31;
  let defaultSets: string[] = [];
  let defaultColorFilter = "Any of these colors";
  let defaultFormat = "Not set";
  let defaultRarity = "Any";
  let defaultRaritySeparator = ":";
  let defaultCmcMin = null;
  let defaultCmcMax = null;
  let defaultOwnedMin = null;
  let defaultOwnedMax = null;
  let defaultBoosters = null;
  // Loop trough the setted filters to adjust defaults
  // console.log("defaultFilters", defaultFilters);
  defaultFilters.forEach((f: any) => {
    // Guess color filter
    if (f.id == "colors") {
      const filter: ColorBitsFilter = f.value;
      const col = new Colors();
      col.addFromBits(filter.color);
      let df = ":";
      if (filter.mode == "not") df = "!=";
      if (filter.mode == "strict") df = "=";
      if (filter.mode == "strictNot") df = "!=";
      if (filter.mode == "strictSubset") df = "<";
      if (filter.mode == "strictSuperset") df = ">";
      if (filter.mode == "subset") df = "<=";
      if (filter.mode == "superset") df = ">=";
      [defaultColorFilter] = Object.keys(colorFilterOptions).filter(
        (k) => colorFilterOptions[k] == df
      );
      defaultCol = col.getBits();
    }
    if (f.id == "setCode") {
      const filter: ArrayFilter = f.value;
      defaultSets = filter.arr;
    }
    if (f.id == "format") {
      const filter: InStringArrayFilter = f.value;
      defaultFormat = filter.value;
    }
    if (f.id == "rarity") {
      const filter: RarityBitsFilter = f.value;
      if (filter.rarity == RARITY_TOKEN) defaultRarity = "Token";
      if (filter.rarity == RARITY_LAND) defaultRarity = "Land";
      if (filter.rarity == RARITY_COMMON) defaultRarity = "Common";
      if (filter.rarity == RARITY_UNCOMMON) defaultRarity = "Uncommon";
      if (filter.rarity == RARITY_RARE) defaultRarity = "Rare";
      if (filter.rarity == RARITY_MYTHIC) defaultRarity = "Mythic";
      if (filter.mode == "=") defaultRaritySeparator = "Equal to";
      if (filter.mode == "!=") defaultRaritySeparator = "Not";
      if (filter.mode == ":") defaultRaritySeparator = "Equal to";
      if (filter.mode == ">") defaultRaritySeparator = "Above";
      if (filter.mode == ">=") defaultRaritySeparator = "Equal or above";
      if (filter.mode == "<") defaultRaritySeparator = "Lower than";
      if (filter.mode == "<=") defaultRaritySeparator = "Lower or equal to";
    }
    if (f.id == "cmc") {
      const filter: MinMaxFilter = f.value;
      if (filter.mode == ":" || filter.mode == "=") {
        defaultCmcMax = filter.value;
        defaultCmcMin = filter.value;
      }
      if (filter.mode == "<") defaultCmcMax = filter.value;
      if (filter.mode == "<=") defaultCmcMax = filter.value;
      if (filter.mode == ">") defaultCmcMin = filter.value;
      if (filter.mode == ">=") defaultCmcMin = filter.value;
    }
    if (f.id == "owned") {
      const filter: MinMaxFilter = f.value;
      if (filter.mode == ":" || filter.mode == "=") {
        defaultOwnedMax = filter.value;
        defaultCmcMin = filter.value;
      }
      if (filter.mode == "<") defaultOwnedMax = filter.value;
      if (filter.mode == "<=") defaultOwnedMax = filter.value;
      if (filter.mode == ">") defaultOwnedMin = filter.value;
      if (filter.mode == ">=") defaultOwnedMin = filter.value;
    }
    if (f.id == "boosters") {
      const filter: InBoolFilter = f.value;
      defaultBoosters = !filter.not;
    }
  });

  // Set filters state
  const [filterColors, setFilterColors] = useState<number>(defaultCol);
  const [filterSets, setFilterSets] = useState<string[]>(defaultSets);
  const [colorFilterOption, setColorFilterOption] =
    useState(defaultColorFilter);
  const [formatFilterOption, setFormatFilterOption] =
    useState<string>(defaultFormat);
  const [rarityFilterOption, setRarityFilterOption] =
    useState<string>(defaultRarity);
  const [raritySeparatorOption, setRaritySeparatorOption] = useState<string>(
    defaultRaritySeparator
  );

  const [cmcMinFilter, setCmcMinFilter] = useState<number | null>(
    defaultCmcMin
  );
  const [cmcMaxFilter, setCmcMaxFilter] = useState<number | null>(
    defaultCmcMax
  );
  const [ownedMinFilter, setOwnedMinFilter] = useState<number | null>(
    defaultOwnedMin
  );
  const [ownedMaxFilter, setOwnedMaxFilter] = useState<number | null>(
    defaultOwnedMax
  );
  const [inBoostersFilter, setInBoostersFilter] = useState<boolean | null>(
    defaultBoosters
  );

  const handleClose = useCallback(() => {
    if (!open) return;
    setOpen(0);
    setTimeout(() => {
      if (closeCallback) {
        closeCallback();
      }
    }, 300);
  }, [closeCallback, open]);

  const closeOnEscape = useCallback(
    (e: KeyboardEvent): void => {
      if (!open) return;
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose, open]
  );

  useEffect(() => {
    window.addEventListener("keydown", closeOnEscape);
    return (): void => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeOnEscape]);

  const handleSearch = useCallback(() => {
    history.push(`/collection/${query}`);
    reduxAction(dispatch, {
      type: "SET_COLLECTION_QUERY",
      arg: { query },
    });
    handleClose();
  }, [history, handleClose, dispatch, query]);

  useEffect(() => {
    // React doesnt give css time to know there was a change
    // in the properties, adding a timeout solves that.
    setTimeout(() => {
      setOpen(1);
    }, 1);
  }, []);

  // Get new query string based on filters data
  useEffect(() => {
    const filters: string[] = [];

    const filterColorsClass = new Colors();
    filterColorsClass.addFromBits(filterColors);

    const colors = `c${
      colorFilterOptions[colorFilterOption] || "="
    }${filterColorsClass
      .get()
      .map((c) => colorsToKey[c] || "")
      .join("")}`;

    const sets = `s:${filterSets.join(",")}`;

    const formats = `f:${formatFilterOption.toLocaleLowerCase()}`;

    const rarity = `r${
      raritySeparatorOptions[raritySeparatorOption] || ":"
    }${rarityFilterOption.toLocaleLowerCase()}`;

    let cmc = "";
    if (cmcMinFilter == null && cmcMaxFilter !== null)
      cmc = `cmc<=${cmcMaxFilter}`;
    if (cmcMinFilter !== null && cmcMaxFilter == null)
      cmc = `cmc>=${cmcMinFilter}`;
    if (cmcMinFilter !== null && cmcMinFilter == cmcMaxFilter)
      cmc = `cmc:${cmcMinFilter}`;
    if (
      cmcMinFilter !== null &&
      cmcMaxFilter !== null &&
      cmcMinFilter !== cmcMaxFilter
    ) {
      filters.push(`cmc>=${cmcMinFilter}`);
      cmc = `cmc<=${cmcMaxFilter}`;
    }
    // ditto cmc
    let owned = "";
    if (ownedMinFilter == null && ownedMaxFilter !== null)
      owned = `owned<=${ownedMaxFilter}`;
    if (ownedMinFilter !== null && ownedMaxFilter == null)
      owned = `owned>=${ownedMinFilter}`;
    if (ownedMinFilter !== null && ownedMinFilter == ownedMaxFilter)
      owned = `owned:${ownedMinFilter}`;
    if (
      ownedMinFilter !== null &&
      ownedMaxFilter !== null &&
      ownedMinFilter !== ownedMaxFilter
    ) {
      filters.push(`owned>=${ownedMinFilter}`);
      owned = `owned<=${ownedMaxFilter}`;
    }

    if (inBoostersFilter !== null) {
      filters.push(`${inBoostersFilter ? "" : "-"}in:boosters`);
    }

    filterColors !== 31 && filters.push(colors);
    filterSets.length > 0 && filters.push(sets);
    formatFilterOption !== "Not set" && filters.push(formats);
    rarityFilterOption !== "Any" && filters.push(rarity);
    (cmcMinFilter !== null || cmcMaxFilter !== null) && filters.push(cmc);
    (ownedMinFilter !== null || ownedMaxFilter !== null) && filters.push(owned);
    setQuery(filters.join(" "));
  }, [
    inBoostersFilter,
    cmcMinFilter,
    cmcMaxFilter,
    ownedMinFilter,
    ownedMaxFilter,
    rarityFilterOption,
    raritySeparatorOption,
    formatFilterOption,
    filterSets,
    filterColors,
    colorFilterOption,
  ]);

  return (
    <div style={{ margin: "16px" }}>
      <div className="close-button" onClick={closeCallback}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="message-sub">Advanced Search</div>
      <div
        style={{
          height: "24px",
          lineHeight: "24px",
          marginBottom: "26px",
          color: "var(--color-text-dark)",
          fontSize: "18px",
        }}
        className="message-sub"
      >
        {query == ""
          ? "Use the filters to generate a query, then search to begin!"
          : query}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ManaFilter initialState={filterColors} callback={setFilterColors} />
        <Select
          options={Object.keys(colorFilterOptions)}
          current={colorFilterOption}
          callback={(opt: string): void => {
            setColorFilterOption(opt);
          }}
        />
      </div>
      <SetsFilter filtered={filterSets} callback={setFilterSets} />
      <div className="search-line">
        <div style={{ lineHeight: "32px" }}>Format: </div>
        <Select
          options={formatFilterOptions}
          current={formatFilterOption}
          callback={(opt: string): void => {
            setFormatFilterOption(opt);
          }}
        />
      </div>
      <div className="search-line">
        <div style={{ lineHeight: "32px" }}>Rarity: </div>
        <Select
          options={Object.keys(raritySeparatorOptions)}
          current={raritySeparatorOption}
          callback={(opt: string): void => {
            setRaritySeparatorOption(opt);
          }}
        />
        <Select
          options={rarityFilterOptions}
          current={rarityFilterOption}
          callback={(opt: string): void => {
            setRarityFilterOption(opt);
          }}
        />
      </div>
      <div className="search-line">
        <div style={{ lineHeight: "32px" }}>In Boosters: </div>
        <Select
          options={inBoostersMode}
          current={
            inBoostersFilter !== null
              ? inBoostersFilter
                ? inBoostersMode[1]
                : inBoostersMode[2]
              : inBoostersMode[0]
          }
          callback={(mode: string): void => {
            if (mode == inBoostersMode[1]) {
              setInBoostersFilter(true);
            } else if (mode == inBoostersMode[2]) {
              setInBoostersFilter(false);
            } else {
              setInBoostersFilter(null);
            }
          }}
        />
      </div>
      <div className="search-line">
        <div style={{ lineHeight: "32px" }}>CMC: </div>
        <Flex style={{ maxWidth: "248px" }}>
          <InputContainer title="Min CMC">
            <input
              value={cmcMinFilter ?? ""}
              onChange={(e): void =>
                setCmcMinFilter(
                  e.target.value !== "" ? parseInt(e.target.value) : null
                )
              }
              placeholder="min"
            />
          </InputContainer>
          <InputContainer title="Max CMC">
            <input
              value={cmcMaxFilter ?? ""}
              onChange={(e): void =>
                setCmcMaxFilter(
                  e.target.value !== "" ? parseInt(e.target.value) : null
                )
              }
              placeholder="max"
            />
          </InputContainer>
        </Flex>
      </div>
      <div className="search-line">
        <div style={{ lineHeight: "32px" }}>Owned: </div>
        <Flex style={{ maxWidth: "248px" }}>
          <InputContainer title="Min">
            <input
              value={ownedMinFilter ?? ""}
              onChange={(e): void =>
                setOwnedMinFilter(
                  e.target.value !== "" ? parseInt(e.target.value) : null
                )
              }
              placeholder="min"
            />
          </InputContainer>
          <InputContainer title="Max">
            <input
              value={ownedMaxFilter ?? ""}
              onChange={(e): void =>
                setOwnedMaxFilter(
                  e.target.value !== "" ? parseInt(e.target.value) : null
                )
              }
              placeholder="max"
            />
          </InputContainer>
        </Flex>
      </div>
      <Button
        style={{ margin: "16px auto" }}
        text="Search"
        onClick={handleSearch}
      />
    </div>
  );
}
