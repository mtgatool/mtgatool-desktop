/* eslint-disable react/jsx-props-no-spreading */
import { database } from "mtgatool-shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useRouteMatch } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import store, { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import doCollectionFilter from "../../../utils/tables/doCollectionFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import InputContainer from "../../InputContainer";
import PagingControls from "../../PagingControls";
import SetsFilter from "../../SetsFilter";
import SortControls, { Sort } from "../../SortControls";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import Toggle from "../../ui/Toggle";
import CardCollection from "./CardCollection";
import getFiltersFromQuery from "./collectionQuery";
import { getCollectionStats } from "./collectionStats";
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

  const [filterSets, setFilterSets] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters<CardsData>>();
  const [sortValue, setSortValue] = useState<Sort<CardsData>>({
    key: "setCode",
    sort: -1,
  });

  const toggleView = useCallback(() => {
    if (viewMode === "cards") setViewMode("set");
    else if (viewMode === "set") setViewMode("cards");
  }, [viewMode]);

  const forceQuery = useSelector(
    (state: AppState) => state.renderer.forceQuery
  );

  const collectionQuery = useSelector(
    (state: AppState) => state.renderer.collectionQuery
  );

  const cardsSize = useSelector((state: AppState) => state.settings.cardsSize);

  const filteredData = useMemo(
    () =>
      filters ? doCollectionFilter(collectionData, filters, sortValue) : [],
    [filters, sortValue, collectionData]
  );

  const pagingControlProps = usePagingControls(filteredData.length, 24);

  useEffect(() => {
    const newFilters = getFiltersFromQuery(
      store.getState().renderer.collectionQuery
    );
    setFilters(newFilters);
    newFilters.forEach((f) => {
      if (f.id === "setCode" && f.type === "array") {
        setFilterSets(f.value.arr);
      }
    });
  }, [forceQuery]);

  useEffect(() => {
    if (filters) {
      filters.forEach((f) => {
        if (f.id === "setCode" && f.type === "array") {
          setFilterSets(f.value.arr);
        }
      });
    }
  }, [filters]);

  useEffect(() => {
    if (match) {
      const { query } = match.params;
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query, forceQuery: true },
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
        arg: { query, forceQuery: true },
      });
    },
    [dispatch]
  );

  const setFilterSetsPre = useCallback(
    (sets: string[]) => {
      // if (filters) {
      //   const newFilters = setFilter(filters, {
      //     type: "array",
      //     id: "setCode",
      //     value: {
      //       mode: ":",
      //       arr: sets,
      //       not: false,
      //     },
      //   });
      //   setFilters(newFilters);
      // }

      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: {
          query: sets.length > 0 ? `s:${sets.join(",")}` : "",
          forceQuery: true,
        },
      });

      const newFilters: Filters<CardsData> = setFilter([], {
        type: "array",
        id: "setCode",
        value: {
          mode: ":",
          arr: sets,
          not: false,
        },
      });

      setFilters(newFilters);
    },
    [dispatch, filters]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query: e.currentTarget.value, forceQuery: false },
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
          c.rarityVal > 2 &&
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
      </Section>
      <Section style={{ flexDirection: "column", marginTop: "16px" }}>
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
            <SetsFilter callback={setFilterSetsPre} filtered={filterSets} />
          </div>
        </div>
      </Section>
      {viewMode === "set" && (
        <SetsView
          setQuery={setQuery}
          filterSets={filterSets}
          filters={filters || []}
          stats={stats}
        />
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
