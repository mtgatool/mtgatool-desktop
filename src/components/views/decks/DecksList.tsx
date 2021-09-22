/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-bitwise */
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters, StringFilterType } from "../../../types/genericFilterTypes";
import { DbDeck } from "../../../types/dbTypes";
import getLocalSetting from "../../../utils/getLocalSetting";
import doDecksFilter from "../../../utils/tables/doDecksFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import DecksArtViewRow from "../../DecksArtViewRow";
import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import getLocalDbValue from "../../../toolDb/getLocalDbValue";

export default function DecksList() {
  const history = useHistory();
  const [colorFilterState, setColorFilterState] = useState(31);
  const { decksIndex } = useSelector((state: AppState) => state.mainData);

  const [allDecksArray, setAllDecksArray] = useState<DbDeck[]>([]);

  useEffect(() => {
    const pubkey = window.toolDb.user?.pubKey || "";

    const promises = Object.keys(decksIndex).map((id) => {
      return getLocalDbValue<DbDeck>(
        `:${pubkey}.decks-${id}-v${decksIndex[id]}`
      ) as any;
    });

    Promise.all(promises).then(setAllDecksArray);
  }, []);

  const defaultDeckFilters: StringFilterType<DbDeck> = {
    type: "string",
    id: "playerId",
    value: {
      string: getLocalSetting("playerId") || "",
      not: false,
    },
  };

  const [filters, setFilters] = useState<Filters<DbDeck>>([defaultDeckFilters]);

  const [sortValue, setSortValue] = useState<Sort<DbDeck>>({
    key: "lastUsed",
    sort: -1,
  });

  const filteredData = useMemo(() => {
    const decksForFiltering = allDecksArray
      .filter((d) => d)
      .map((d) => {
        return {
          ...d,
          lastUsed: new Date(d.lastUpdated).getTime(),
          colors: d.colors > 32 ? d.colors - 32 : d.colors,
        };
      });
    return doDecksFilter(decksForFiltering, filters, sortValue);
  }, [allDecksArray, decksIndex, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openDeck = useCallback(
    (deck: DbDeck) => {
      // reduxAction(dispatch, { type: "SET_BACK_GRPID", arg: deck.tile });
      const pubKey = window.toolDb.user?.pubKey || "";
      history.push(
        `/decks/${encodeURIComponent(
          `:${pubKey}.decks-${deck.id}-v${deck.version}`
        )}`
      );
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
      <div className="section" style={{ marginBottom: "0px" }}>
        <ManaFilter initialState={colorFilterState} callback={setColorFilter} />
      </div>
      <div
        className="section"
        style={{ margin: "16px 0", flexDirection: "column" }}
      >
        <SortControls<DbDeck>
          setSortCallback={setSortValue}
          defaultSort={sortValue}
          columnKeys={["lastUpdated", "lastUsed", "colors", "format"]}
          columnNames={["Last Modified", "Last Used", "Colors", "Format"]}
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
