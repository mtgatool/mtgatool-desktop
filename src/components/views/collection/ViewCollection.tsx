/* eslint-disable react/jsx-props-no-spreading */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useRouteMatch } from "react-router-dom";
import reduxAction from "../../../redux/reduxAction";
import store, { AppState } from "../../../redux/stores/rendererStore";

import InputContainer from "../../InputContainer";
import Button from "../../ui/Button";

import getFiltersFromQuery from "./collectionQuery";

import { CardsData } from "../../../types/collectionTypes";
import doCollectionFilter from "../../../utils/tables/doCollectionFilter";

import CardCollection from "./CardCollection";
import PagingControls from "../../PagingControls";
import usePagingControls from "../../../hooks/usePagingControls";
import SortControls, { Sort } from "../../SortControls";
import SetsFilter from "../../SetsFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import { Filters } from "../../../types/genericFilterTypes";
import getCssQuality from "../../../utils/getCssQuality";

interface ViewCollectionProps {
  collectionData: CardsData[];
  openAdvancedCollectionSearch: () => void;
}

export default function ViewCollection(props: ViewCollectionProps) {
  const match = useRouteMatch<{ query: string }>("/collection/:query");
  const history = useHistory();

  const { collectionData, openAdvancedCollectionSearch } = props;
  const dispatch = useDispatch();

  const [filterSets, setFilterSets] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters<CardsData>>();
  const [sortValue, setSortValue] = useState<Sort<CardsData>>({
    key: "name",
    sort: 1,
  });

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
      if (f.id === "setCodes" && f.type === "array") {
        setFilterSets(f.value.arr);
      }
    });
  }, [forceQuery]);

  useEffect(() => {
    if (match) {
      const { query } = match.params;
      reduxAction(dispatch, {
        type: "SET_COLLECTION_QUERY",
        arg: { query, forceQuery: true },
      });
    }
  }, []);

  const setFilterSetsPre = useCallback(
    (sets: string[]) => {
      setFilterSets(sets);
      if (filters) {
        const newFilters = setFilter(filters, {
          type: "array",
          id: "setCodes",
          value: {
            mode: ":",
            arr: sets,
            not: false,
          },
        });
        setFilters(newFilters);
      }
    },
    [filters]
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

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ flexDirection: "column" }}
      >
        <div style={{ display: "flex" }}>
          <Button
            onClick={openAdvancedCollectionSearch}
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

        <div>
          <SetsFilter callback={setFilterSetsPre} filtered={filterSets} />
        </div>
      </div>
      <div
        className={`section ${getCssQuality()}`}
        style={{ marginTop: "0px", flexDirection: "column" }}
      >
        <SortControls<CardsData>
          defaultSort={sortValue}
          setSortCallback={setSortValue}
          columnKeys={["name", "rarityVal", "cmc", "cid", "set"]}
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
      </div>
    </>
  );
}
