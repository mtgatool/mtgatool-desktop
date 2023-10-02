/* eslint-disable no-unused-vars */

import { MutableRefObject, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ReactComponent as SyncIcon } from "../../assets/images/svg/cloud-sync.svg";
import { ReactComponent as StatsIcon } from "../../assets/images/svg/stats.svg";
import {
  DateOption,
  dateOptions,
  setDateOption,
  setEvents,
} from "../../redux/slices/FilterSlice";
import { AppState } from "../../redux/stores/rendererStore";
import getEventPrettyName from "../../utils/getEventPrettyName";
import InputContainer from "../InputContainer";
import SvgButton from "../SvgButton";
import Section from "./Section";
import Select from "./Select";

interface FilterSectionProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
}

export default function FilterSection(props: FilterSectionProps) {
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);
  const datePickerDate = useSelector(
    (state: AppState) => state.filter.startDate
  );
  const eventFilter = useSelector(
    (state: AppState) => state.filter.eventsFilter
  );
  const fromDateOption = useSelector(
    (state: AppState) => state.filter.dateOption
  );
  const dispatch = useDispatch();

  const { openHistoryStatsPopup, datePickerDoShow } = props;

  const containerRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

  const setEventFilter = useCallback((evid: string) => {
    dispatch(setEvents(evid));
  }, []);

  const allEvents = fullStats ? [...fullStats.eventsIndex] : [""];

  let transformedEvents = allEvents.sort();

  const rankedEvents: string[] = [
    "Alchemy_Ladder",
    "Ladder",
    "Historic_Ladder",
    "Explorer_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
    "Traditional_Explorer_Ladder",
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
    "Alchemy_Ladder",
    "Ladder",
    "Alchemy_Ladder",
    "Historic_Ladder",
    "Explorer_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
    "Traditional_Explorer_Ladder",
    "%%Drafts",
    ...drafts,
    "%%Other Events",
    ...new Set(transformedEvents),
  ];

  const refreshMatches = useCallback(() => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "REFRESH_MATCHES",
      });
    }
  }, []);

  return (
    <>
      <div className="FilterSection">
        <Section style={{ marginTop: "16px", marginBottom: "16px" }}>
          <Select
            style={{ width: "280px" }}
            options={transformedEvents}
            optionFormatter={(e) => (e === "" ? "All" : getEventPrettyName(e))}
            current={eventFilter}
            callback={setEventFilter}
          />
          <div style={{ lineHeight: "32px", marginLeft: "16px" }}>From:</div>
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
            callback={(opt: DateOption) => {
              dispatch(setDateOption(opt));
            }}
          />

          <SvgButton
            svg={SyncIcon}
            style={{
              height: "24px",
              width: "24px",
              margin: "auto 0 auto auto",
              padding: "4px",
            }}
            onClick={refreshMatches}
          />
          <SvgButton
            svg={StatsIcon}
            style={{
              height: "24px",
              width: "24px",
              margin: "auto 0 auto 16px",
              padding: "4px",
            }}
            onClick={openHistoryStatsPopup}
          />
        </Section>
      </div>
    </>
  );
}
