/* eslint-disable react/jsx-props-no-spreading */
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters } from "../../../types/genericFilterTypes";

import doHistoryFilter from "../../../utils/tables/doHistoryFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import getMatchesData, { MatchData } from "./getMatchesData";
import ListItemMatch from "./ListItemMatch";

export default function HistoryList() {
  const history = useHistory();
  const { matchesIndex } = useSelector((state: AppState) => state.mainData);

  const [filters] = useState<Filters<MatchData>>([]);

  const [sortValue, setSortValue] = useState<Sort<MatchData>>({
    key: "timestamp",
    sort: -1,
  });

  const filteredData = useMemo(() => {
    if (filters) {
      const matchesForFiltering = getMatchesData(matchesIndex);
      return doHistoryFilter(matchesForFiltering, filters, sortValue);
    }
    return [];
  }, [matchesIndex, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openMatch = useCallback(
    (match: MatchData) => {
      history.push(`/history/${match.matchId}`);
    },
    [history]
  );

  return (
    <>
      <div className="section" style={{ marginBottom: "0px" }} />
      <div className="section">
        <div className="history-table-wrapper">
          <SortControls<MatchData>
            setSortCallback={setSortValue}
            defaultSort={sortValue}
            columnKeys={[
              "timestamp",
              "rank",
              "duration",
              "playerWins",
              "playerLosses",
              "eventId",
              "oppDeckColors",
              "playerDeckColors",
            ]}
            columnNames={[
              "Date",
              "Rank",
              "Duration",
              "Wins",
              "Losses",
              "Event",
              "Opponent Colors",
              "Player Colors",
            ]}
          />
          {filteredData
            .slice(
              pagingControlProps.pageIndex * pagingControlProps.pageSize,
              (pagingControlProps.pageIndex + 1) * pagingControlProps.pageSize
            )
            .map((match) => {
              return (
                <ListItemMatch
                  key={match.matchId}
                  match={match}
                  openMatchCallback={openMatch}
                />
              );
            })}
          <div style={{ marginTop: "10px" }}>
            <PagingControls
              {...pagingControlProps}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
