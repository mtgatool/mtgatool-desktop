/* eslint-disable react/jsx-props-no-spreading */
import { getEventPrettyName } from "mtgatool-shared";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import usePagingControls from "../../../hooks/usePagingControls";
import { AppState } from "../../../redux/stores/rendererStore";
import { Filters, StringFilterType } from "../../../types/genericFilterTypes";
import getCssQuality from "../../../utils/getCssQuality";
import getLocalSetting from "../../../utils/getLocalSetting";

import { ReactComponent as StatsIcon } from "../../../assets/images/svg/stats.svg";

import doHistoryFilter from "../../../utils/tables/doHistoryFilter";
import setFilter from "../../../utils/tables/filters/setFilter";
import PagingControls from "../../PagingControls";
import SortControls, { Sort } from "../../SortControls";
import SvgButton from "../../SvgButton";
import Select from "../../ui/Select";
import { MatchData } from "./getMatchesData";
import ListItemMatch from "./ListItemMatch";
import aggregateStats from "../../../utils/aggregateStats";
import reduxAction from "../../../redux/reduxAction";

interface HistoryListProps {
  openHistoryStatsPopup: () => void;
  matchesData: MatchData[];
}

export default function HistoryList(props: HistoryListProps) {
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);
  const history = useHistory();
  const dispatch = useDispatch();
  const { openHistoryStatsPopup, matchesData } = props;

  const [eventFilter, setEventFilterState] = useState("");

  const defaultHistoryFilters: StringFilterType<MatchData> = {
    type: "string",
    id: "uuid",
    value: {
      string: getLocalSetting("playerId") || "",
      not: false,
      exact: false,
    },
  };

  const [filters, setFilters] = useState<Filters<MatchData>>([
    defaultHistoryFilters,
  ]);

  const setEventFilter = useCallback(
    (evid: string) => {
      const newFilters = setFilter(filters, {
        type: "string",
        id: "eventId",
        value: {
          string: evid,
          not: false,
          exact: evid !== "",
        },
      });

      setFilters(newFilters);
      setEventFilterState(evid);
    },
    [filters]
  );

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
  }, [dispatch, matchesData, filters, sortValue]);

  const pagingControlProps = usePagingControls(filteredData.length, 25);

  const openMatch = useCallback(
    (match: MatchData) => {
      history.push(
        `/history/${encodeURIComponent(
          window.toolDb.getUserNamespacedKey(`matches-${match.matchId}`)
        )}`
      );
    },
    [history]
  );

  const allEvents = fullStats ? ["", ...fullStats.eventsIndex] : [""];

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ marginBottom: "0px" }}
      >
        <Select
          options={allEvents.sort()}
          optionFormatter={(e) => (e === "" ? "All" : getEventPrettyName(e))}
          current={eventFilter}
          callback={setEventFilter}
        />

        <SvgButton
          svg={StatsIcon}
          style={{
            height: "24px",
            width: "24px",
            margin: "auto 0 auto auto",
            padding: "4px",
          }}
          onClick={openHistoryStatsPopup}
        />
      </div>
      <div className={`section ${getCssQuality()}`}>
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
