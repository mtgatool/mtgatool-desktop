/* eslint-disable react/jsx-props-no-spreading */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useRouteMatch } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import cardsDb from "../../../utils/cardsDb/cardsDbClient";
import getSetFormatBand from "../../../utils/getSetFormatBand";
import database from "../../../utils/mtga/database";
import doCollectionFilter from "../../../utils/tables/doCollectionFilter";
import InputContainer from "../../InputContainer";
import PagingControls from "../../PagingControls";
import SetsFilter from "../../SetsFilter";
import SortControls, { Sort } from "../../SortControls";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import Toggle from "../../ui/Toggle";
import CardCollection from "./CardCollection";
import getFiltersFromQuery, {
  parseFilterValue,
  removeFilterFromQuery,
} from "./collectionQuery";
import {
  buildCollectionIdsQuery,
  buildCollectionQuery,
  rowsToCardsData,
} from "./collectionSql";
import { getCollectionStats } from "./collectionStats";
import makeExportSetForScryfallFn from "./exportSetForScryfall";
import OwnershipLegend from "./OwnershipLegend";
import SetsView from "./SetsView";

interface ViewCollectionProps {
  /** Only populated on the legacy path; empty when the SQLite database is up. */
  collectionData: CardsData[];
  /** Bumped by ContentWrapper when the worker's collection table changes. */
  collectionEpoch?: number;
  openAdvancedCollectionSearch: () => void;
}

export default function ViewCollection(props: ViewCollectionProps) {
  const match = useRouteMatch<{ query: string }>("/collection/:query");
  const history = useHistory();

  const [exportUnowned, setExportUnowned] = useState<boolean>(false);
  const [exportDigital, setExportDigital] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "set">("cards");

  const { collectionData, collectionEpoch, openAdvancedCollectionSearch } =
    props;
  const dispatch = useDispatch();

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

  // SQLite path: filtering, sorting and paging all happen in the database, so
  // nothing here ever holds more than one page. collectionSql.ts is a direct
  // translation of doCollectionFilter, which is still used verbatim when there
  // is no database.
  const sqlAvailable = cardsDb.available;

  // Every matching id, for the pager total and the per-set stats — the only two
  // things that genuinely need the whole result set. One column, no ORDER BY.
  const [ids, setIds] = useState<number[]>([]);
  const [pageRows, setPageRows] = useState<CardsData[]>([]);

  const legacyFiltered = useMemo(
    () =>
      !sqlAvailable && filters
        ? doCollectionFilter(collectionData, filters, sortValue)
        : [],
    [sqlAvailable, filters, sortValue, collectionData]
  );

  useEffect(() => {
    if (!sqlAvailable || !filters) return undefined;

    let cancelled = false;
    const { sql, params } = buildCollectionIdsQuery(filters);
    cardsDb
      .query(sql, params)
      .then((result) => {
        if (!cancelled) setIds(result.values.map((row) => row[0] as number));
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log("[cards-db] collection ids query failed", e);
      });

    return () => {
      cancelled = true;
    };
  }, [sqlAvailable, filters, collectionEpoch]);

  const total = sqlAvailable ? ids.length : legacyFiltered.length;
  const pagingControlProps = usePagingControls(total, 24);
  const { pageIndex, pageSize, gotoPage } = pagingControlProps;

  useEffect(() => {
    if (!sqlAvailable || !filters) return undefined;

    let cancelled = false;
    const { sql, params } = buildCollectionQuery(filters, sortValue, {
      limit: pageSize,
      offset: pageIndex * pageSize,
    });
    cardsDb
      .query(sql, params)
      .then((result) => {
        if (!cancelled) setPageRows(rowsToCardsData(result.values));
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log("[cards-db] collection page query failed", e);
      });

    return () => {
      cancelled = true;
    };
  }, [sqlAvailable, filters, sortValue, pageIndex, pageSize, collectionEpoch]);

  // A new search can leave you past the end of a shorter result set, which
  // reads as an empty collection rather than as page 40 of 2.
  useEffect(() => {
    gotoPage(0);
  }, [filters]);

  /** The rows actually rendered — one page, from whichever path is live. */
  const visibleRows = useMemo(
    () =>
      sqlAvailable
        ? pageRows
        : legacyFiltered.slice(
            pageIndex * pageSize,
            (pageIndex + 1) * pageSize
          ),
    [sqlAvailable, pageRows, legacyFiltered, pageIndex, pageSize]
  );

  /**
   * Every matching row, fetched on demand. Only the CSV export and the Scryfall
   * console helper want this, and both are user-initiated, so the ~1s it costs
   * is paid when someone asks for it rather than on every render.
   */
  const fetchAllRows = useCallback(
    async (useFilters: boolean): Promise<CardsData[]> => {
      if (!sqlAvailable) return useFilters ? legacyFiltered : collectionData;
      const { sql, params } = buildCollectionQuery(
        useFilters && filters ? filters : [],
        sortValue
      );
      const result = await cardsDb.query(sql, params);
      return rowsToCardsData(result.values);
    },
    [sqlAvailable, filters, sortValue, legacyFiltered, collectionData]
  );

  makeExportSetForScryfallFn(() => fetchAllRows(false));

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

  // getCollectionStats reads every one of these ids with `database.card()`,
  // which only answers for cards already fetched — and the only cards fetched
  // are the two dozen on the page being shown. Every other card in the set was
  // read as undefined and dropped, so a set's statistics and its completion
  // heat map came out empty however many cards were actually owned.
  //
  // Fetching them is asynchronous and the stats are not, so this counts
  // completed fetches and lets the memo below recompute once they land.
  const [cardsFetched, setCardsFetched] = useState(0);
  useEffect(() => {
    const wanted = sqlAvailable ? ids : legacyFiltered.map((r) => r.id);
    if (!wanted.length) return undefined;

    let cancelled = false;
    cardsDb
      .cards(wanted)
      .then(() => {
        if (!cancelled) setCardsFetched((n) => n + 1);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [sqlAvailable, ids, legacyFiltered]);

  const stats = useMemo(
    () =>
      getCollectionStats(sqlAvailable ? ids : legacyFiltered.map((r) => r.id)),
    // cardsFetched is not read here: it is the signal that the cards the stats
    // are about have arrived, and the numbers change without any id changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sqlAvailable, ids, legacyFiltered, cardsFetched]
  );

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
        // A typed f:/format: filter from a different band would contradict
        // the set just clicked (f:standard + a Historic set shows nothing;
        // f:historic + a Standard set is not what the click meant either).
        // The click wins: drop the format token on a band mismatch.
        const formatToken = parseFilterValue(newQuery).find(([key]) => {
          const nKey = key.startsWith("-") ? key.slice(1) : key;
          return nKey === "f" || nKey === "format";
        });
        const format = formatToken?.[2]?.replace(/"/g, "").toLowerCase();
        if (format && sets.some((code) => getSetFormatBand(code) !== format)) {
          newQuery = removeFilterFromQuery(newQuery, ["f", "format"]);
        }
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

  // Exports the whole collection, not the current search — which is what it
  // always did, back when the view held the unfiltered array. On the SQLite
  // path the rows are fetched here instead, when the button is pressed.
  const downloadTxtFile = useCallback(async () => {
    const rows = await fetchAllRows(false);

    function generateCollectionCSV() {
      let csv = `Count;Name;Edition;Collector Number;Rarity\n`;

      rows.forEach((c) => {
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
  }, [exportUnowned, exportDigital, fetchAllRows]);

  return (
    <>
      {/* Everything in this row is about the CSV, including both toggles —
          which read as filters on the collection below until the row says
          otherwise. */}
      <Section style={{ marginTop: "16px" }}>
        <div className="collection-export">
          <div className="collection-export-label">Export</div>
          <Toggle
            style={{ maxWidth: "240px", margin: 0 }}
            text="Include unowned cards"
            value={exportUnowned}
            callback={setExportUnowned}
          />
          <Toggle
            style={{ maxWidth: "240px", margin: 0 }}
            text="Include digital sets"
            value={exportDigital}
            callback={setExportDigital}
          />
          <Button
            style={{ margin: 0, padding: "0 12px", whiteSpace: "nowrap" }}
            className="button-simple"
            text="Download CSV"
            onClick={downloadTxtFile}
          />
        </div>
      </Section>
      <Section style={{ flexDirection: "column", marginTop: "16px" }}>
        {/* A timestamp, not a heading — it was an h3, which is why it sat there
            announcing itself. */}
        <div className="collection-updated">
          Collection last updated{" "}
          {new Date(
            uuidData[currentUUID]?.cards?.updated || 0
          ).toLocaleString()}
        </div>
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
          {/* Chips rather than a table header: what follows is a grid of card
              images, not columns. Drop the variant to put the header back. */}
          <SortControls<CardsData>
            variant="chips"
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
            {visibleRows.map((card) => {
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
          <OwnershipLegend />
        </Section>
      )}
    </>
  );
}
