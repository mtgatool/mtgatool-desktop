/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

import { database, getEventPrettyName } from "mtgatool-shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters } from "../../../types/genericFilterTypes";
import { getCardImage } from "../../../utils/getCardArtCrop";

import doExploreFilter from "../../../utils/tables/doExploreFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import Flex from "../../Flex";

import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import RanksFilter from "../../RanksFilter";
import SortControls, { Sort } from "../../SortControls";

import Button from "../../ui/Button";

import Section from "../../ui/Section";
import Select from "../../ui/Select";
import {
  DbExploreAggregated,
  ExploreDeckData,
  limitRecord,
} from "./doExploreAggregation";
import ExploreAggregator from "./ExploreAggregator";
import ExploreDeckView from "./ExploreDeckView";
import ListItemExplore from "./ListItemExplore";

interface BestCards {
  copies: number;
  id: number;
  rating: number;
}

const MODE_EXPLORE = 1;
const MODE_AGGREGATOR = 2;
const MODE_DECKVIEW = 3;

type Modes =
  | typeof MODE_EXPLORE
  | typeof MODE_AGGREGATOR
  | typeof MODE_DECKVIEW;

export default function ViewExplore() {
  const [mode, setMode] = useState<Modes>(MODE_EXPLORE);
  const [currentDeck, setCurrentDeck] = useState<ExploreDeckData | null>(null);

  const [allBestCards, setAllBestCards] = useState<BestCards[]>([]);

  const avatars = useSelector((state: AppState) => state.avatars.avatars);

  const [eventsList, setEventsList] = useState<string[]>([]);
  const [eventFilter, setEventFilterState] = useState("Ladder");
  const [data, setData] = useState<DbExploreAggregated | null>(null);

  const dispatch = useDispatch();

  const hoverCard = (id: number, hover: boolean): void => {
    reduxAction(dispatch, {
      type: hover ? "SET_HOVER_IN" : "SET_HOVER_OUT",
      arg: { grpId: id },
    });
  };

  const [colorFilterState, setColorFilterState] = useState(31);

  const [ranksFilterState, setRanksFilterState] = useState(63);

  const fetchAvatar = useFetchAvatar();

  const [filters, setFilters] = useState<Filters<ExploreDeckData>>([]);

  const [sortValue, setSortValue] = useState<Sort<ExploreDeckData>>({
    key: "wr",
    sort: -1,
  });

  useEffect(() => {
    window.toolDb
      .getData<DbExploreAggregated>(`exploredata-Ladder`)
      .then((d) => {
        if (d) {
          setData(d);
          fetchAvatar(d.aggregator);
        }
      });
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return [];

    const decksForFiltering = Object.keys(data.data)
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
        if (cardObj && !cardObj.type.toLowerCase().includes("land")) {
          if (!allCardsCopies[cardObj.name]) {
            allCardsCopies[cardObj.name] = [];
          }
          allCardsCopies[cardObj.name].push(c.quantity);
        }
      });
      Object.keys(d.bestCards).forEach((c) => {
        const cardObj = database.card(parseInt(c));
        if (cardObj) {
          if (!allBest[cardObj.name]) {
            allBest[cardObj.name] = 0;
          }
          allBest[cardObj.name] += 1;
        }
      });
    });
    Object.keys(allCardsCopies).forEach((id) => {
      allCardsAverageCopies[id] =
        allCardsCopies[id].reduce((acc, c) => acc + c, 0) /
        allCardsCopies[id].length;
    });
    allBest = limitRecord(allBest, 10);

    const finalBestCards = Object.keys(allBest).map((name) => {
      return {
        copies: allCardsAverageCopies[name],
        id: database.cardByName(name)?.id || 0,
        rating: allBest[name],
      };
    });
    setAllBestCards(finalBestCards);

    return doExploreFilter(decksForFiltering, filters, sortValue);
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

  useEffect(() => {
    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    const queryKey = `explore-${currentDay - 1}-`;
    window.toolDb.queryKeys(queryKey).then((res) => {
      if (res) {
        const fixedList = res
          .filter(
            (k) =>
              !k.includes("NPE_") &&
              !k.includes("ColorChallenge_") &&
              !k.includes("DirectGame")
          )
          .map((k) => k.slice(queryKey.length, -5));

        setEventsList(Array.from(new Set(fixedList)));
      }
    });
  }, []);

  const doSearch = useCallback(() => {
    window.toolDb
      .getData<DbExploreAggregated>(`exploredata-${eventFilter}`)
      .then((d) => {
        if (d) {
          setData(d);
          fetchAvatar(d.aggregator);
        }
      });
  }, [eventFilter]);

  // Get default events list to filter
  let transformedEvents = eventsList.sort();

  const rankedEvents: string[] = [
    "Ladder",
    "Alchemy_Ladder",
    "Historic_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
  ];

  const drafts: string[] = [];

  eventsList.forEach((ev) => {
    if (rankedEvents.includes(ev)) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
    }
    if (ev.indexOf("Draft") !== -1) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
      drafts.push(ev);
    }
  });

  transformedEvents = [
    "%%Ranked",
    "Ladder",
    "Alchemy_Ladder",
    "Historic_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
    "%%Drafts",
    ...drafts,
    "%%Other Events",
    ...new Set(transformedEvents),
  ];

  return (
    <>
      {mode === MODE_EXPLORE && (
        <>
          <Section style={{ margin: "16px 0", flexDirection: "column" }}>
            <Flex style={{ justifyContent: "center", height: "48px" }}>
              <Select
                style={{ width: "280px" }}
                options={transformedEvents}
                optionFormatter={getEventPrettyName}
                current={eventFilter}
                callback={setEventFilterState}
              />
              <Button text="Search" onClick={doSearch} />
            </Flex>
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
            <Flex
              style={{
                textAlign: "center",
                flexDirection: "column",
                lineHeight: "32px",
              }}
            >
              {data && (
                <>
                  <i>
                    Results shown range between{" "}
                    {new Date(data.from).toDateString()} and{" "}
                    {new Date(data.to).toDateString()}
                  </i>

                  <i>Best cards</i>
                  <div
                    className="card-lists-list"
                    style={{
                      margin: "8px auto",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {allBestCards
                      .sort((a, b) => {
                        if (a.rating > b.rating) return -1;
                        if (a.rating < b.rating) return 1;
                        return 0;
                      })
                      .map((b, ind) => {
                        const grpId = b.id;
                        const cardObj = database.card(grpId);
                        if (cardObj) {
                          return (
                            <Flex style={{ flexDirection: "column" }}>
                              <img
                                key={`${b.id}-bestcards-${ind}`}
                                onMouseEnter={(): void => {
                                  hoverCard(grpId, true);
                                }}
                                onMouseLeave={(): void => {
                                  hoverCard(grpId, false);
                                }}
                                style={{
                                  width: `70px`,
                                }}
                                src={getCardImage(cardObj, "normal")}
                                className="mulligan-card-img"
                              />
                              <div className="explore-card-text">
                                {b.rating}
                              </div>
                              <div className="explore-card-sub">
                                Decks using it
                              </div>
                              <div className="explore-card-text">
                                {b.copies.toFixed(2)}
                              </div>
                              <div className="explore-card-sub">
                                Avg. per deck.
                              </div>
                            </Flex>
                          );
                        }
                        return <></>;
                      })}
                  </div>
                  <div className="maker-container">
                    <i className="maker-name">Pushed by</i>
                    <div
                      className="maker-avatar"
                      style={{
                        backgroundImage: `url(${avatars[data.aggregator]})`,
                      }}
                    />
                  </div>
                </>
              )}
              <i>
                Want to contribute?{" "}
                <a className="link" onClick={() => setMode(MODE_AGGREGATOR)}>
                  try the aggregator!
                </a>
              </i>
            </Flex>
          </Section>
          <Section style={{ flexDirection: "column", marginBottom: "16px" }}>
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
                    (pagingControlProps.pageIndex + 1) *
                      pagingControlProps.pageSize
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
      )}
      {mode === MODE_AGGREGATOR && (
        <Section style={{ marginTop: "16px" }}>
          <ExploreAggregator day={10} onExit={() => setMode(MODE_EXPLORE)} />
        </Section>
      )}
      {mode === MODE_DECKVIEW && currentDeck && (
        <ExploreDeckView
          data={currentDeck}
          goBack={() => setMode(MODE_EXPLORE)}
        />
      )}
    </>
  );
}
