/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-bitwise */
import { ChangeEvent, Fragment, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters, StringFilterType } from "../../../types/genericFilterTypes";
import { StatsDeck } from "../../../types/dbTypes";

import doDecksFilter from "../../../utils/tables/doDecksFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import DecksArtViewRow from "../../DecksArtViewRow";
import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import getCssQuality from "../../../utils/getCssQuality";
import useDebounce from "../../../hooks/useDebounce";
import InputContainer from "../../InputContainer";
import reduxAction from "../../../redux/reduxAction";
import globalData from "../../../utils/globalData";
import getLocalSetting from "../../../utils/getLocalSetting";
import Flex from "../../Flex";
import Toggle from "../../ui/Toggle";
import unsetFilter from "../../../utils/tables/filters/unsetFilter";
import setLocalSetting from "../../../utils/setLocalSetting";

export default function DecksList() {
  const dispatch = useDispatch();
  const history = useHistory();
  const [colorFilterState, setColorFilterState] = useState(31);
  const [deckNameFilterState, setDeckNameFilterState] = useState("");
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);
  const hiddenDecks = useSelector(
    (state: AppState) => state.mainData.hiddenDecks
  );

  const [showHidden, setShowHidden] = useState(
    getLocalSetting("showHiddenDecks")
  );

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const defaultDeckFilters: StringFilterType<StatsDeck> = {
    type: "string",
    id: "playerId",
    value: {
      string: currentUUID,
      not: false,
      exact: true,
    },
  };

  const getDeckWithStats = useCallback(
    (id: string): StatsDeck | undefined => {
      if (!fullStats) return undefined;

      const hashes = fullStats.decks[id];
      let latestTimestamp = fullStats.deckIndex[hashes[0]].lastUsed;
      let latestHash = hashes[0];

      const deckStats = {
        gameWins: 0,
        gameLosses: 0,
        matchWins: 0,
        matchLosses: 0,
      };

      hashes.forEach((h) => {
        const d = fullStats.deckIndex[h];
        deckStats.gameWins += d.stats.gameWins;
        deckStats.gameLosses += d.stats.gameLosses;
        deckStats.matchWins += d.stats.matchWins;
        deckStats.matchLosses += d.stats.matchLosses;
        if (latestTimestamp < d.lastUsed) {
          latestTimestamp = d.lastUsed;
          latestHash = h;
        }
      });

      return {
        ...fullStats.deckIndex[latestHash],
        totalGames: deckStats.gameWins + deckStats.gameLosses,
        winrate:
          (100 / (deckStats.gameWins + deckStats.gameLosses)) *
          deckStats.gameWins,
        stats: deckStats,
      };
    },
    [fullStats]
  );

  const [filters, setFilters] = useState<Filters<StatsDeck>>([
    defaultDeckFilters,
  ]);

  const [sortValue, setSortValue] = useState<Sort<StatsDeck>>({
    key: "lastUsed",
    sort: -1,
  });

  const filteredData = useMemo(() => {
    if (!fullStats) return [];

    const latestDeckHashesArray = Object.keys(fullStats.decks).map((id) => {
      const hashes = fullStats.decks[id];
      let latestTimestamp = fullStats.deckIndex[hashes[0]].lastUsed;
      let latestHash = hashes[0];

      hashes.forEach((h) => {
        if (latestTimestamp < fullStats.deckIndex[h].lastUsed) {
          const d = fullStats.deckIndex[h];
          latestTimestamp = d.lastUsed;
          latestHash = h;
        }
      });

      return latestHash;
    });

    const decksForFiltering = latestDeckHashesArray
      .map((hash) => fullStats.deckIndex[hash])
      .map((d) => {
        return {
          ...d,
          lastUsed: new Date(d.lastUsed).getTime(),
          colors: d.colors > 32 ? d.colors - 32 : d.colors,
        };
      });

    let newFilters = unsetFilter(filters, "inarraystring");
    if (showHidden !== "true") {
      newFilters = setFilter(filters, {
        type: "inarraystring",
        id: "id",
        value: {
          value: [...hiddenDecks],
          not: false,
        },
      });
    }

    return doDecksFilter(decksForFiltering, newFilters, sortValue);
  }, [fullStats, showHidden, hiddenDecks, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openDeck = useCallback(
    (deck: StatsDeck) => {
      history.push(`/decks/${encodeURIComponent(deck.id)}`);
    },
    [history]
  );

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

  const deckNameDebouncer = useDebounce(500);

  const onDeckNameFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newFilters = setFilter(filters, {
        type: "string",
        id: "name",
        value: {
          string: event.target.value,
          not: false,
          exact: false,
        },
      });

      deckNameDebouncer(() => setFilters(newFilters));
      setDeckNameFilterState(event.target.value);
    },
    [deckNameDebouncer, filters]
  );

  const hideDeck = useCallback(
    (id: string) => {
      const newList = [...hiddenDecks];
      newList.push(id);
      reduxAction(dispatch, {
        type: "SET_HIDDEN_DECKS",
        arg: newList,
      });
      globalData.hiddenDecks = newList;
    },
    [showHidden, dispatch]
  );

  const unhideDeck = useCallback(
    (id: string) => {
      const newList = [...hiddenDecks];
      const pos = newList.indexOf(id);
      if (pos !== -1) {
        newList.splice(pos, 1);
      }
      reduxAction(dispatch, {
        type: "SET_HIDDEN_DECKS",
        arg: newList,
      });
      globalData.hiddenDecks = newList;
    },
    [showHidden, dispatch]
  );

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ marginBottom: "0px", flexDirection: "column" }}
      >
        <Flex style={{ width: "100%" }}>
          <InputContainer>
            <input
              value={deckNameFilterState}
              placeholder="Search by name"
              onChange={onDeckNameFilterChange}
            />
          </InputContainer>
          <ManaFilter
            initialState={colorFilterState}
            callback={setColorFilter}
          />
        </Flex>
        <Flex>
          <Toggle
            style={{ maxWidth: "180px" }}
            text="Show hidden"
            value={showHidden === "true"}
            callback={(val: boolean): void => {
              setLocalSetting("showHiddenDecks", val ? "true" : "false");
              setShowHidden(val ? "true" : "false");
            }}
          />
        </Flex>
      </div>
      <div
        className={`section ${getCssQuality()}`}
        style={{ margin: "16px 0", flexDirection: "column" }}
      >
        <SortControls<StatsDeck>
          setSortCallback={setSortValue}
          defaultSort={sortValue}
          columnKeys={["lastUsed", "name", "winrate", "totalGames", "colors"]}
          columnNames={[
            "Last Used",
            "Name",
            "Winrate",
            "Games played",
            "Colors",
          ]}
        />
        <div className="decks-table-wrapper">
          {filteredData
            .slice(
              pagingControlProps.pageIndex * pagingControlProps.pageSize,
              (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
            )
            .map((deck) => {
              const fullDeck = getDeckWithStats(deck?.id || "");
              if (fullDeck) {
                return (
                  <DecksArtViewRow
                    clickDeck={openDeck}
                    hidden={globalData.hiddenDecks.includes(deck?.id)}
                    unhide={unhideDeck}
                    hide={hideDeck}
                    key={deck.id}
                    deck={fullDeck}
                  />
                );
              }
              return <Fragment key={`${new Date().getTime()}-decklist`} />;
            })}
        </div>

        <div style={{ marginTop: "10px" }}>
          <PagingControls
            {...pagingControlProps}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>
    </>
  );
}
