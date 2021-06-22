/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-bitwise */
import { Fragment, useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters, StringFilterType } from "../../../types/genericFilterTypes";
import { GunDeck } from "../../../types/gunTypes";
import getLocalSetting from "../../../utils/getLocalSetting";
import doDecksFilter from "../../../utils/tables/doDecksFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import DecksArtViewRow from "../../DecksArtViewRow";
import ManaFilter from "../../ManaFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";

export default function DecksList() {
  const history = useHistory();
  const [colorFilterState, setColorFilterState] = useState(31);

  const defaultDeckFilters: StringFilterType<GunDeck> = {
    type: "string",
    id: "playerId",
    value: {
      string: getLocalSetting("playerId") || "",
      not: false,
    },
  };

  const [filters, setFilters] = useState<Filters<GunDeck>>([
    defaultDeckFilters,
  ]);

  const [sortValue, setSortValue] = useState<Sort<GunDeck>>({
    key: "lastModified",
    sort: -1,
  });

  const { decksIndex, decks } = useSelector(
    (state: AppState) => state.mainData
  );

  const filteredData = useMemo(() => {
    const decksForFiltering = Object.keys(decksIndex)
      .map((key) => decks[`${key}-v${decksIndex[key]}`])
      .filter((d) => d)
      .map((d) => {
        return {
          ...d,
          colors: d.colors > 32 ? d.colors - 32 : d.colors,
        };
      });
    return doDecksFilter(decksForFiltering, filters, sortValue);
  }, [decksIndex, decks, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openDeck = useCallback(
    (deck: GunDeck) => {
      // reduxAction(dispatch, { type: "SET_BACK_GRPID", arg: deck.tile });
      history.push(`/decks/${deck.deckId}`);
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
        <SortControls<GunDeck>
          setSortCallback={setSortValue}
          defaultSort={sortValue}
          columnKeys={["lastModified", "lastUsed", "colors", "format"]}
          columnNames={["Last Modified", "Last Used", "Colors", "Format"]}
        />
        <div className="decks-table-wrapper">
          {filteredData
            .slice(
              pagingControlProps.pageIndex * pagingControlProps.pageSize,
              (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
            )
            .map((deck) => {
              if (deck && deck.internalDeck) {
                return (
                  <DecksArtViewRow
                    clickDeck={openDeck}
                    key={deck.deckId}
                    deck={deck}
                  />
                );
              }
              return <Fragment key={deck.deckId} />;
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
