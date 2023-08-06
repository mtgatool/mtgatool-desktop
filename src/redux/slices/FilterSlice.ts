/* eslint-disable no-param-reassign */

import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Sort } from "../../components/SortControls";
import { MatchData } from "../../components/views/history/convertDbMatchData";
import { StatsDeck } from "../../types/dbTypes";
import {
  Filters,
  FilterTypeBase,
  MinMaxFilterType,
  StringFilterType,
} from "../../types/genericFilterTypes";
import getLocalSetting from "../../utils/getLocalSetting";
import setLocalSetting from "../../utils/setLocalSetting";
import setFilter from "../../utils/tables/filters/setFilter";
import { AppState } from "../stores/rendererStore";

export type DateOption =
  | "All Time"
  | "Custom"
  | "Last 24 hours"
  | "Last 30 days"
  | "Last Year";

const getCurrentFilterDate = (dateOption: DateOption, startDate: Date) => {
  switch (dateOption) {
    case "Custom":
      return startDate;
    case "All Time":
      return new Date(0);
    case "Last Year":
      return new Date(Date.now() - 31557600000);
    case "Last 30 days":
      return new Date(Date.now() - 2592000000);
    case "Last 24 hours":
      return new Date(Date.now() - 86400000);
    default:
      return new Date(0);
  }
};

const calculateAllMatchDataFilters = (): Filters<MatchData> => {
  const filters: FilterTypeBase[] = [];
  const playerFilter: StringFilterType<MatchData> = {
    type: "string",
    id: "uuid",
    value: {
      string: getLocalSetting("playerId") || "",
      not: false,
      exact: false,
    },
  };
  console.log("setting playerId to ", getLocalSetting("playerId") || "");
  filters.push(playerFilter);

  const date = new Date(parseInt(getLocalSetting("filterDate"), 10));
  const dateOption = getLocalSetting("filterDateOption") as DateOption;
  const dateFilter: MinMaxFilterType<MatchData> = {
    type: "minmax",
    id: "timestamp",
    value: {
      value: getCurrentFilterDate(dateOption, date).getTime(),
      mode: ">",
      not: false,
    },
  };
  filters.push(dateFilter);

  const eventFilter: StringFilterType<MatchData> = {
    type: "string",
    id: "eventId",
    value: {
      string: getLocalSetting("filterEventOptions"),
      not: false,
      exact: getLocalSetting("filterEventOptions") !== "",
    },
  };
  filters.push(eventFilter);

  return <Filters<MatchData>>filters;
};

const calculateAllDeckFilters = (): Filters<StatsDeck> => {
  return <Filters<StatsDeck>>[];
};

const initialFilterState = {
  startDate: new Date(parseInt(getLocalSetting("filterDate"), 10)),
  dateOption: getLocalSetting("filterDateOption") as DateOption,
  eventsFilter: getLocalSetting("filterEventOptions"),
  matchDataFilters: calculateAllMatchDataFilters(),
  deckFilters: calculateAllDeckFilters(),
  deckSort: {
    key: "lastUsed",
    sort: -1,
  } as Sort<StatsDeck>,
};

type FilterState = typeof initialFilterState;
export const dateOptions = [
  "All Time",
  "Custom",
  "Last 24 hours",
  "Last 30 days",
  "Last Year",
] as DateOption[];

const filterSlice = createSlice({
  name: "filters",
  initialState: initialFilterState,
  reducers: {
    setDate: (state: FilterState, action: PayloadAction<Date>): void => {
      state.startDate = action.payload;
      const newFilters = setFilter(state.matchDataFilters, {
        type: "minmax",
        id: "timestamp",
        value: {
          value: action.payload.getTime(),
          mode: ">",
          not: false,
        },
      });

      setLocalSetting("filterDate", action.payload.getTime().toString());
      state.matchDataFilters = newFilters;
    },
    setDateOption: (
      state: FilterState,
      action: PayloadAction<DateOption>
    ): void => {
      state.dateOption = action.payload;

      const newFilters = setFilter(state.matchDataFilters, {
        type: "minmax",
        id: "timestamp",
        value: {
          value: getCurrentFilterDate(
            state.dateOption,
            state.startDate
          ).getTime(),
          mode: ">",
          not: false,
        },
      });
      setLocalSetting("filterDateOption", action.payload);
      state.matchDataFilters = newFilters;
    },
    setEvents: (state: FilterState, action: PayloadAction<string>): void => {
      state.eventsFilter = action.payload;
      const newFilters = setFilter(state.matchDataFilters, {
        type: "string",
        id: "eventId",
        value: {
          string: action.payload,
          not: false,
          exact: action.payload !== "",
        },
      });
      setLocalSetting("filterEventOptions", action.payload);
      state.matchDataFilters = newFilters;
    },
    setMatchDataFilters: (
      state: FilterState,
      action: PayloadAction<Filters<MatchData>>
    ): void => {
      state.matchDataFilters = action.payload;
    },
    setDecksFilters: (
      state: FilterState,
      action: PayloadAction<Filters<StatsDeck>>
    ): void => {
      state.deckFilters = action.payload;
    },
    resetDecksFilters: (state: FilterState): void => {
      state.deckFilters = calculateAllDeckFilters();
    },
    setDeckSort: (
      state: FilterState,
      action: PayloadAction<Sort<StatsDeck>>
    ): void => {
      state.deckSort = action.payload;
    },
  },
});

export const {
  setDate,
  setDateOption,
  setEvents,
  setMatchDataFilters,
  setDecksFilters,
  setDeckSort,
} = filterSlice.actions;

// Selectors

export const selectStartDate = (state: AppState) => {
  return state.filter.startDate;
};
export const selectDateOption = (state: AppState) => {
  return state.filter.dateOption;
};

export const selectCurrentFilterDate = createSelector(
  [selectDateOption, selectStartDate],
  (dateOption, startDate) => {
    return getCurrentFilterDate(dateOption, startDate);
  }
);

export default filterSlice;
