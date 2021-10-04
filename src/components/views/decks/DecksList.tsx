/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-bitwise */
import { Fragment, useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters, StringFilterType } from "../../../types/genericFilterTypes";
import { StatsDeck } from "../../../types/dbTypes";
import getLocalSetting from "../../../utils/getLocalSetting";
import doDecksFilter from "../../../utils/tables/doDecksFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import DecksArtViewRow from "../../DecksArtViewRow";
import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import getCssQuality from "../../../utils/getCssQuality";

export default function DecksList() {
  const history = useHistory();
  const [colorFilterState, setColorFilterState] = useState(31);
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);

  const defaultDeckFilters: StringFilterType<StatsDeck> = {
    type: "string",
    id: "playerId",
    value: {
      string: getLocalSetting("playerId") || "",
      not: false,
    },
  };

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
          latestTimestamp = fullStats.deckIndex[h].lastUsed;
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
    return doDecksFilter(decksForFiltering, filters, sortValue);
  }, [fullStats, filters, sortValue]);

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

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ marginBottom: "0px" }}
      >
        <ManaFilter initialState={colorFilterState} callback={setColorFilter} />
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
              if (deck) {
                return (
                  <DecksArtViewRow
                    clickDeck={openDeck}
                    key={deck.id}
                    deck={deck}
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
