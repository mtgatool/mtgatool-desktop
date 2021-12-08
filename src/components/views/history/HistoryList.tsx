/* eslint-disable react/jsx-props-no-spreading */
import { getEventPrettyName } from "mtgatool-shared";
import {
  MutableRefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
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

import InputContainer from "../../InputContainer";

interface HistoryListProps {
  openHistoryStatsPopup: () => void;
  datePickerDate: Date;
  datePickerDoShow: () => void;
  setDatePickerDate: (newDate: Date) => void;
  datePickerCallbackRef: MutableRefObject<(d: Date) => void>;
  matchesData: MatchData[];
}

const dateOptions = ["All Time", "Custom", "Last 30 days", "Last Year"];

export default function HistoryList(props: HistoryListProps) {
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);
  const history = useHistory();
  const dispatch = useDispatch();
  const {
    openHistoryStatsPopup,
    matchesData,
    datePickerDate,
    datePickerDoShow,
    setDatePickerDate,
    datePickerCallbackRef,
  } = props;

  const [eventFilter, setEventFilterState] = useState("");
  const [fromDateOption, setFromDateOption] = useState(dateOptions[0]);

  const containerRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

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

  const setDateFilter = useCallback(
    (date: Date) => {
      const newFilters = setFilter(filters, {
        type: "minmax",
        id: "timestamp",
        value: {
          value: date.getTime(),
          mode: ">",
          not: false,
        },
      });

      setFilters(newFilters);
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

  const allEvents = fullStats ? [...fullStats.eventsIndex] : [""];

  let transformedEvents = allEvents.sort();

  const rankedEvents: string[] = [
    "Ladder",
    "Historic_Ladder",
    "Traditional_Ladder",
    "Traditional_Historic_Ladder",
  ];

  const drafts: string[] = [];

  allEvents.forEach((ev) => {
    if (rankedEvents.includes(ev)) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
    }
    if (ev.indexOf("Draft") !== -1) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
      drafts.push(ev);
    }
  });

  transformedEvents = [
    "",
    "%%Ranked",
    "Ladder",
    "Historic_Ladder",
    "Traditional_Ladder",
    "Traditional_Historic_Ladder",
    "%%Drafts",
    ...drafts,
    "%%Other Events",
    ...new Set(transformedEvents),
  ];

  datePickerCallbackRef.current = (date: Date) => {
    setDateFilter(date);
    setFromDateOption(dateOptions[1]);
  };

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ marginBottom: "0px" }}
      >
        <Select
          style={{ width: "280px" }}
          options={transformedEvents}
          optionFormatter={(e) => (e === "" ? "All" : getEventPrettyName(e))}
          current={eventFilter}
          callback={setEventFilter}
        />
        <div style={{ lineHeight: "32px", marginLeft: "16px" }}>From: </div>
        <InputContainer style={{ width: "auto" }} title="">
          <input
            onClick={datePickerDoShow}
            ref={containerRef}
            style={{
              backgroundColor: "var(--color-base)",
              width: "140px",
              cursor: "pointer",
            }}
            readOnly
            type="date"
            value={datePickerDate.toISOString().substring(0, 10)}
          />
        </InputContainer>
        <Select
          options={dateOptions}
          current={fromDateOption}
          callback={(opt) => {
            const now = new Date().getTime();
            if (opt === dateOptions[0]) {
              setDatePickerDate(new Date(0));
              setDateFilter(new Date(0));
            }
            if (opt === dateOptions[2]) {
              setDatePickerDate(new Date(now - 2592000000));
              setDateFilter(new Date(now - 2592000000));
            }
            if (opt === dateOptions[3]) {
              setDatePickerDate(new Date(now - 31560000000));
              setDateFilter(new Date(now - 31560000000));
            }
            setFromDateOption(opt);
          }}
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
