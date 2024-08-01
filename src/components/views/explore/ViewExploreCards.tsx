/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable radix */
import { database } from "mtgatool-shared";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import { getCardImage } from "../../../utils/getCardArtCrop";
import applySort from "../../../utils/tables/applySort";
import Flex from "../../Flex";
import PagingControls from "../../PagingControls";
import SetsFilter from "../../SetsFilter";
import SortControls, { Sort } from "../../SortControls";
import Section from "../../ui/Section";
import {
  DbExploreAggregated,
  ExploreCardData,
  limitRecord,
} from "./doExploreAggregation";
import { BestCards, Modes } from "./ExploreTypes";
import ListItemExploreCard from "./ListItemExploreCard";

interface ViewExploreCardsProps {
  data: DbExploreAggregated;
  setMode: (mode: Modes) => void;
}

export default function ViewExploreCards(props: ViewExploreCardsProps) {
  const { data } = props;

  const [allBestCards, setAllBestCards] = useState<BestCards[]>([]);
  const [filteredSets, setFilteredSets] = useState<string[]>([]);

  const [sortValue, setSortValue] = useState<Sort<ExploreCardData>>({
    key: "winrate",
    sort: -1,
  });

  const dispatch = useDispatch();

  const hoverCard = (id: number, hover: boolean): void => {
    reduxAction(dispatch, {
      type: hover ? "SET_HOVER_IN" : "SET_HOVER_OUT",
      arg: { grpId: id },
    });
  };

  const filteredData: ExploreCardData[] = useMemo(() => {
    if (!data) return [];

    // get most played cards
    const allCardsAverageCopies: Record<string, number> = {};
    const allCardsCopies: Record<string, number[]> = {};
    let allBest: Record<string, number> = {};

    Object.values(data.data || {}).forEach((d) => {
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

    const finalBestCards = Object.keys(allBest).map((name) => {
      return {
        copies: allCardsAverageCopies[name],
        id: database.cardByName(name)?.GrpId || 0,
        rating: allBest[name],
      };
    });
    setAllBestCards(finalBestCards);

    const filteredCards = (data.cards || []).filter((c) => {
      const cardObj = database.card(c.id);
      return cardObj
        ? filteredSets.length === 0
          ? true
          : filteredSets.includes(cardObj.Set.toLocaleLowerCase()) ||
            (cardObj.DigitalSet &&
              filteredSets.includes(cardObj.DigitalSet?.toLocaleLowerCase()))
        : false;
    });

    return applySort(filteredCards, sortValue);
  }, [data, filteredSets, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  return (
    <>
      <Section
        style={{
          marginBottom: "16px",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <i>Most used cards</i>
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
                  <Flex
                    key={`${b.id}-bestcards-${ind}`}
                    style={{ flexDirection: "column" }}
                  >
                    <img
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
                    <div className="explore-card-text">{b.rating}</div>
                    <div className="explore-card-sub">Decks using it</div>
                    <div className="explore-card-text">
                      {b.copies ? b.copies.toFixed(2) : "1.00"}
                    </div>
                    <div className="explore-card-sub">Avg. per deck.</div>
                  </Flex>
                );
              }
              return <></>;
            })}
        </div>
        <SetsFilter callback={setFilteredSets} filtered={filteredSets} />
      </Section>
      <Section className="explore-cards-sort-controls">
        {data && filteredData.length > 0 ? (
          <>
            <SortControls<ExploreCardData>
              setSortCallback={setSortValue}
              defaultSort={sortValue}
              columnKeys={[
                "name",
                "winrate",
                "initHandWinrate",
                "sideInWinrate",
                "sideOutWinrate",
                "avgTurnUsed",
                "avgFirstTurn",
              ]}
              columnNames={[
                "Name",
                "Winrate",
                "First Hand Winrate",
                "Sided in Winrate",
                "Sided Out Winrate",
                "Avg. Turn",
                "Avg. First Turn",
              ]}
            />

            {filteredData
              .slice(
                pagingControlProps.pageIndex * pagingControlProps.pageSize,
                (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
              )
              .map((cardData, n) => {
                return (
                  <ListItemExploreCard
                    key={`explore-card-list-item-${n}`}
                    data={cardData}
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
          <h3
            style={{
              textAlign: "center",
              margin: "16px 0",
              color: "var(--color-r)",
            }}
          >
            No detailed cards data for this aggregation.
          </h3>
        )}
      </Section>
    </>
  );
}
