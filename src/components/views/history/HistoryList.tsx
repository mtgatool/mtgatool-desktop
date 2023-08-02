/* eslint-disable react/jsx-props-no-spreading */

import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import usePagingControls from "../../../hooks/usePagingControls";
import reduxAction from "../../../redux/reduxAction";
import { selectCurrentFilterDate } from "../../../redux/slices/FilterSlice";
import { AppState } from "../../../redux/stores/rendererStore";
import getUserNamespacedKey from "../../../toolDb/getUserNamespacedKey";
import aggregateStats from "../../../utils/aggregateStats";
import doHistoryFilter from "../../../utils/tables/doHistoryFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import FilterSection from "../../ui/FilterSection";
import Section from "../../ui/Section";
import { MatchData } from "./getMatchesData";
import ListItemMatch from "./ListItemMatch";

interface HistoryListProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
  matchesData: MatchData[];
}

export default function HistoryList(props: HistoryListProps) {
  const filters = useSelector(
    (state: AppState) => state.filter.matchDataFilters
  );
  const filterDate = useSelector(selectCurrentFilterDate);
  const pubKey = useSelector((state: AppState) => state.renderer.pubKey);
  const history = useHistory();
  const dispatch = useDispatch();
  const { openHistoryStatsPopup, matchesData, datePickerDoShow } = props;

  const [sortValue, setSortValue] = useState<Sort<MatchData>>({
    key: "timestamp",
    sort: -1,
  });

  const filteredData = useMemo(() => {
    if (filters) {
      const filtered = doHistoryFilter(matchesData, filters, sortValue);

      const newHistoryStats = aggregateStats(filtered);
      reduxAction(dispatch, {
        type: "SET_HISTORY_STATS",
        arg: newHistoryStats,
      });

      return filtered;
    }
    return [];
  }, [dispatch, matchesData, filters, sortValue, filterDate]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openMatch = useCallback(
    (match: MatchData) => {
      history.push(
        `/history/${encodeURIComponent(
          getUserNamespacedKey(pubKey, `matches-${match.matchId}`)
        )}`
      );
    },
    [pubKey, history]
  );

  return (
    <>
      <FilterSection
        openHistoryStatsPopup={openHistoryStatsPopup}
        datePickerDoShow={datePickerDoShow}
      />
      <Section style={{ marginBottom: "16px" }}>
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
      </Section>
    </>
  );
}
