/* eslint-disable react/jsx-props-no-spreading */

import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import { selectCurrentFilterDate } from "../../../redux/slices/FilterSlice";
import { AppState } from "../../../redux/stores/rendererStore";
import doHistoryFilter from "../../../utils/tables/doHistoryFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import { MatchData } from "../history/convertDbMatchData";
import ListItemMatch from "../history/ListItemMatch";

interface UserHistoryListProps {
  matchesData: MatchData[];
  pubKey: string;
}

export default function UserHistoryList(props: UserHistoryListProps) {
  const filters = useSelector(
    (state: AppState) => state.filter.matchDataFilters
  );
  const filterDate = useSelector(selectCurrentFilterDate);
  const history = useHistory();
  const dispatch = useDispatch();
  const { matchesData, pubKey } = props;

  const [sortValue, setSortValue] = useState<Sort<MatchData>>({
    key: "timestamp",
    sort: -1,
  });

  const filteredData = useMemo(() => {
    if (filters && matchesData) {
      const filtered = doHistoryFilter(matchesData, filters, sortValue);

      return filtered;
    }
    return [];
  }, [dispatch, matchesData, filters, sortValue, filterDate]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openMatch = useCallback(
    (match: MatchData) => {
      history.push(
        `/history/${encodeURIComponent(`:${pubKey}.matches-${match.matchId}`)}`
      );
    },
    [pubKey, history]
  );

  return (
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
  );
}
