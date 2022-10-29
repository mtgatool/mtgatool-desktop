/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable radix */
import { database } from "mtgatool-shared";
import { useCallback, useMemo, useState } from "react";

import usePagingControls from "../../../hooks/usePagingControls";

import { Filters } from "../../../types/genericFilterTypes";
import doExploreFilter from "../../../utils/tables/doExploreFilter";

import setFilter from "../../../utils/tables/filters/setFilter";
import Flex from "../../Flex";
import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import RanksFilter from "../../RanksFilter";
import SortControls, { Sort } from "../../SortControls";
import Section from "../../ui/Section";
import {
  DbExploreAggregated,
  ExploreDeckData,
  limitRecord,
} from "./doExploreAggregation";
import { Modes, MODE_DECKVIEW } from "./ExploreTypes";
import ListItemExplore from "./ListItemExplore";

interface ViewExploreDecksProps {
  data: DbExploreAggregated;
  setCurrentDeck: (deck: ExploreDeckData) => void;
  setMode: (mode: Modes) => void;
}

export default function ViewExploreDecks(props: ViewExploreDecksProps) {
  const { data, setCurrentDeck, setMode } = props;

  const [colorFilterState, setColorFilterState] = useState(31);

  const [ranksFilterState, setRanksFilterState] = useState(63);

  const [filters, setFilters] = useState<Filters<ExploreDeckData>>([]);

  const [sortValue, setSortValue] = useState<Sort<ExploreDeckData>>({
    key: "wr",
    sort: -1,
  });

  const filteredData: ExploreDeckData[] = useMemo(() => {
    if (!data) return [];

    const decksForFiltering = Object.keys(data.data || [])
      .map((hash) => data.data[hash])
      .map((d) => {
        return {
          ...d,
          colors: d.colors > 32 ? d.colors - 32 : d.colors,
        };
      });

    // get most played cards
    const allCardsAverageCopies: Record<string, number> = {};
    const allCardsCopies: Record<string, number[]> = {};
    let allBest: Record<string, number> = {};

    decksForFiltering.forEach((d) => {
      d.deck.forEach((c) => {
        const cardObj = database.card(c.id);
        if (cardObj && !cardObj.Types.toLowerCase().includes("land")) {
          if (!allCardsCopies[cardObj.Name]) {
            allCardsCopies[cardObj.Name] = [];
          }
          allCardsCopies[cardObj.Name].push(c.quantity);
        }
      });
      Object.keys(d.bestCards).forEach((c) => {
        const cardObj = database.card(parseInt(c));
        if (cardObj) {
          if (!allBest[cardObj.Name]) {
            allBest[cardObj.Name] = 0;
          }
          allBest[cardObj.Name] += 1;
        }
      });
    });

    Object.keys(allCardsCopies).forEach((id) => {
      allCardsAverageCopies[id] =
        allCardsCopies[id].reduce((acc, c) => acc + c, 0) /
        allCardsCopies[id].length;
    });
    allBest = limitRecord(allBest, 10);

    // const finalBestCards = Object.keys(allBest).map((name) => {
    //   return {
    //     copies: allCardsAverageCopies[name],
    //     id: database.cardByName(name)?.id || 0,
    //     rating: allBest[name],
    //   };
    // });
    // setAllBestCards(finalBestCards);

    return doExploreFilter(
      decksForFiltering.filter((d) => d.wins + d.losses > 2),
      filters,
      sortValue
    );
  }, [data, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const setColorFilter = useCallback(
    (color: number) => {
      const newFilters = setFilter(filters, {
        type: "colors",
        id: "colors",
        value: {
          color,
          mode: "subset",
          not: false,
        },
      });

      setFilters(newFilters);
      setColorFilterState(color);
    },
    [filters]
  );

  const setRanksFilter = useCallback(
    (rank: number) => {
      const newFilters = setFilter(filters, {
        type: "colors",
        id: "ranks",
        value: {
          color: rank,
          mode: "subset",
          not: false,
        },
      });

      setFilters(newFilters);
      setRanksFilterState(rank);
    },
    [filters]
  );

  return (
    <>
      <Section style={{ marginBottom: "16px", flexDirection: "column" }}>
        <Flex style={{ justifyContent: "center", height: "48px" }}>
          <ManaFilter
            initialState={colorFilterState}
            callback={setColorFilter}
          />
          <RanksFilter
            initialState={ranksFilterState}
            callback={setRanksFilter}
          />
        </Flex>
      </Section>
      <Section className="explore-sort-controls">
        {data ? (
          <>
            <SortControls<ExploreDeckData>
              setSortCallback={setSortValue}
              defaultSort={sortValue}
              columnKeys={["wr", "colors", "ranks", "avgDuration"]}
              columnNames={["Winrate", "Colors", "Ranks", "Duration"]}
            />

            {filteredData
              .slice(
                pagingControlProps.pageIndex * pagingControlProps.pageSize,
                (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
              )
              .map((deckData, n) => {
                return (
                  <ListItemExplore
                    key={`explore-list-item-${n}`}
                    data={deckData}
                    openExploreDeckCallback={(d) => {
                      setCurrentDeck(d);
                      setMode(MODE_DECKVIEW);
                    }}
                  />
                );
              })}

            <div style={{ marginTop: "10px" }}>
              <PagingControls
                {...pagingControlProps}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </>
        ) : (
          <></>
        )}
      </Section>
    </>
  );
}
