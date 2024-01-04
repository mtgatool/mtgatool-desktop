/* eslint-disable react/jsx-props-no-spreading */
import { database } from "mtgatool-shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useRouteMatch } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import doCollectionFilter from "../../../utils/tables/doCollectionFilter";
import InputContainer from "../../InputContainer";
import PagingControls from "../../PagingControls";
import SetsFilter from "../../SetsFilter";
import SortControls, { Sort } from "../../SortControls";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import Toggle from "../../ui/Toggle";
import CardCollection from "./CardCollection";
import getFiltersFromQuery, { removeFilterFromQuery } from "./collectionQuery";
import { getCollectionStats } from "./collectionStats";
import makeExportSetForScryfallFn from "./exportSetForScryfall";
import SetsView from "./SetsView";

interface ViewCollectionProps {
  collectionData: CardsData[];
  openAdvancedCollectionSearch: () => void;
}

export default function ViewCollection(props: ViewCollectionProps) {
  const match = useRouteMatch<{ query: string }>("/collection/:query");
  const history = useHistory();

  const [exportUnowned, setExportUnowned] = useState<boolean>(false);
  const [exportDigital, setExportDigital] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "set">("cards");

  const { collectionData, openAdvancedCollectionSearch } = props;
  const dispatch = useDispatch();

  makeExportSetForScryfallFn(collectionData);

  const [filters, setFilters] = useState<Filters<CardsData>>();
  const [sortValue, setSortValue] = useState<Sort<CardsData>>({
    key: "setCode",
    sort: -1,
  });

  const filterSets = useMemo(() => {
    const sets: string[] = [];
    if (filters) {
      filters.forEach((f) => {
        if (f.type === "array" && f.id === "setCode") {
          f.value.arr.forEach((setCode) => sets.push(setCode));
        }
      });
    }
    return sets;
  }, [filters]);

  const toggleView = useCallback(() => {
    if (viewMode === "cards") setViewMode("set");
    else if (viewMode === "set") setViewMode("cards");
  }, [viewMode]);

  const collectionQuery = useSelector(
    (state: AppState) => state.renderer.collectionQuery
  );

  const cardsSize = useSelector((state: AppState) => state.settings.cardsSize);

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const filteredData = useMemo(
    () =>
      filters ? doCollectionFilter(collectionData, filters, sortValue) : [],
    [filters, sortValue, collectionData]
  );

  const pagingControlProps = usePagingControls(filteredData.length, 24);

  useEffect(() => {
    const newFilters = getFiltersFromQuery(collectionQuery);
    setFilters(newFilters);
  }, [collectionQuery]);

  useEffect(() => {
    if (match) {
      const { query } = match.params;
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query },
      });
    }
  }, []);

  const stats = useMemo(() => {
    const cardIds = filteredData.map((row) => row.id);
    return getCollectionStats(cardIds);
  }, [filteredData]);

  const setQuery = useCallback(
    (query: string) => {
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query },
      });
    },
    [dispatch]
  );

  const setFilterSets = useCallback(
    (sets: string[]) => {
      let newQuery = removeFilterFromQuery(collectionQuery, ["s", "set"]);
      if (sets.length > 0) {
        newQuery += ` s:${sets.join(",")}`;
      }
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: {
          query: newQuery,
        },
      });
    },
    [dispatch, filters, collectionQuery]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query: e.currentTarget.value },
      });
    },
    [dispatch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        const newFilters = getFiltersFromQuery(e.currentTarget.value);
        setFilters(newFilters);
        history.push(`/collection/${e.currentTarget.value}`);
      }
    },
    [history]
  );

  const downloadTxtFile = useCallback(() => {
    function generateCollectionCSV() {
      let csv = `Count;Name;Edition;Collector Number;Rarity\n`;

      collectionData.forEach((c) => {
        const cardObj = database.card(c.id);

        const isDigital =
          cardObj &&
          (cardObj.DigitalSet !== "" || cardObj.IsDigitalOnly === true);

        if (
          cardObj &&
          (!isDigital || exportDigital) &&
          cardObj.Set !== "WC" &&
          cardObj.Rarity !== "token" &&
          !(
            c.fullType.toLocaleLowerCase().includes("basic land") &&
            (c.fullName.toLocaleLowerCase().includes("plains") ||
              c.fullName.toLocaleLowerCase().includes("island") ||
              c.fullName.toLocaleLowerCase().includes("swamp") ||
              c.fullName.toLocaleLowerCase().includes("mountain") ||
              c.fullName.toLocaleLowerCase().includes("forest"))
          ) &&
          (c.owned > 0 || exportUnowned)
        ) {
          let set = cardObj.DigitalSet ? cardObj.DigitalSet : cardObj.Set;

          const setName =
            database.setNames[set.toUpperCase()] ||
            database.setNames[set.toLowerCase()];
          if (setName) {
            set = database.sets[setName].scryfall;
          }

          csv += `${c.owned};${cardObj.Name};${set};${c.cid};${cardObj.Rarity}\n`;
        }
      });

      return csv;
    }

    const exportTxt = generateCollectionCSV();
    const element = document.createElement("a");
    const file = new Blob([exportTxt], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "collection.csv";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }, [exportUnowned, exportDigital, collectionData]);

  return (
    <>
      <Section style={{ marginTop: "16px" }}>
        <div className="flex">
          <Toggle
            style={{ maxWidth: "240px", marginRight: "48px" }}
            text="Include unowned cards?"
            value={exportUnowned}
            callback={setExportUnowned}
          />
          <Toggle
            style={{ maxWidth: "240px", marginRight: "48px" }}
            text="Include digital sets?"
            value={exportDigital}
            callback={setExportDigital}
          />
          <i
            style={{
              lineHeight: "30px",
              height: "30px",
              margin: "auto auto auto 8px",
              color: "var(--color-text-dark)",
            }}
          >
            Collection is saved in CSV format
          </i>
          <Button
            style={{ margin: "16px" }}
            className="button-simple"
            text="Download Collection"
            onClick={downloadTxtFile}
          />
        </div>
      </Section>
      <Section style={{ flexDirection: "column", marginTop: "16px" }}>
        <h3 className="flex" style={{ margin: "0 auto 24px auto" }}>
          Owned cards data was last updated on{" "}
          {new Date(
            uuidData[currentUUID]?.cards?.updated || 0
          ).toLocaleString()}
        </h3>
        <div style={{ display: "flex", width: "100%" }}>
          <Button
            onClick={openAdvancedCollectionSearch}
            style={{ minWidth: "160px", margin: "auto 8px auto 0" }}
            text="Advanced Filters"
          />
          <InputContainer title="Search">
            <input
              value={collectionQuery}
              placeholder="Search.."
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </InputContainer>
        </div>
        <div style={{ display: "flex", width: "100%" }}>
          <Button
            onClick={toggleView}
            style={{ minWidth: "160px", margin: "32px 8px auto 0px" }}
            text={viewMode === "set" ? "Cards view" : "Set view"}
          />
          <div style={{ width: "100%" }}>
            <SetsFilter callback={setFilterSets} filtered={filterSets} />
          </div>
        </div>
      </Section>
      {viewMode === "set" && (
        <SetsView setQuery={setQuery} filters={filters || []} stats={stats} />
      )}
      {viewMode === "cards" && (
        <Section className="collection-sort-controls">
          <SortControls<CardsData>
            defaultSort={sortValue}
            setSortCallback={setSortValue}
            columnKeys={["fullName", "rarityVal", "cmc", "cid", "setCode"]}
            columnNames={["Name", "Rarity", "CMC", "Collector ID", "Set"]}
          />
          <div
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(${
                100 + cardsSize * 15 + 12
              }px, 1fr))`,
            }}
            className="collection-table"
          >
            {filteredData
              .slice(
                pagingControlProps.pageIndex * pagingControlProps.pageSize,
                (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
              )
              .map((card) => {
                return (
                  <CardCollection
                    card={card}
                    key={`collection-card-${card.id}`}
                  />
                );
              })}
          </div>

          <div style={{ marginTop: "10px" }}>
            <PagingControls
              {...pagingControlProps}
              pageSizeOptions={[8, 16, 24, 32]}
            />
          </div>
        </Section>
      )}
    </>
  );
}
