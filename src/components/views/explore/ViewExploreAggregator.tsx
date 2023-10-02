import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { putData, queryKeys } from "../../../toolDb/worker-wrapper";
import { DbMatch } from "../../../types/dbTypes";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Flex from "../../Flex";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import Select from "../../ui/Select";
import doExploreAggregation, {
  DbExploreAggregated,
} from "./doExploreAggregation";
import transformEventsList from "./transformEventsList";

/**
 * Aggregates data into explore
 * Only meant to be used when there is no data for what we are looking for.
 */
export default function ViewExploreAggregator() {
  const history = useHistory();

  const [isOk, setIsOk] = useState(false);

  const [eventId, setEventId] = useState<string>("Ladder");

  const [eventsList, setEventsList] = useState<string[]>([]);

  const [data, setData] = useState<Record<string, DbMatch>>({});

  const [queryDataState, setQueryDataState] = useState<{
    foundKeys: number;
    queriedKeys: number;
    savedKeys: number;
    loadingPercent: number;
  }>({
    foundKeys: 0,
    queriedKeys: 0,
    savedKeys: 0,
    loadingPercent: 0,
  });

  const beginDataQuery = useCallback((days: number, event: string) => {
    setIsOk(false);
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "EXPLORE_DATA_QUERY",
        days,
        event,
      });
    }
  }, []);

  const doAggregation = useCallback(() => {
    setIsOk(false);
    const aggregatedData = doExploreAggregation(Object.values(data));
    if (aggregatedData.data && Object.values(aggregatedData.data).length > 0) {
      putData<DbExploreAggregated>(`exploredata-${eventId}`, aggregatedData)
        .then((res) => {
          if (res) {
            setIsOk(true);
          }
        })
        .catch(console.warn);
    }
  }, [eventId, data]);

  useEffect(() => {
    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    const finalEventList: string[] = [];

    async function queryDayKeys(day: number): Promise<string[]> {
      const dayKeys = await queryKeys(`explore-${day}-`);
      return (
        dayKeys?.map((k: string) => k.slice(`explore-${day}-`.length, -5)) || []
      );
    }

    async function doQueryLoop() {
      for (let i = 0; i < 5; i += 1) {
        const day = currentDay - i;
        // eslint-disable-next-line no-await-in-loop
        const dayKeys = await queryDayKeys(day);
        finalEventList.push(...dayKeys);
      }

      const fixedList = finalEventList.filter(
        (k) =>
          !k.includes("NPE_") &&
          !k.includes("ColorChallenge_") &&
          !k.includes("DirectGame")
      );

      setEventsList(Array.from(new Set(fixedList)));
    }

    doQueryLoop();

    const listener = (e: any) => {
      const { type, value } = e.data;
      if (type === `EXPLORE_DATA_QUERY_STATE`) {
        setQueryDataState(value);
      }
      if (type === `EXPLORE_DATA_QUERY`) {
        setData(value);
      }
    };
    if (window.toolDbWorker) {
      window.toolDbWorker.addEventListener("message", listener);
    }

    return () => {
      if (window.toolDbWorker) {
        window.toolDbWorker.removeEventListener("message", listener);
      }
    };
  }, []);

  // Get default events list to filter
  const transformedEvents = transformEventsList(eventsList);

  return (
    <Section style={{ marginTop: "16px" }}>
      <div className="explore-aggregator">
        <h2 style={{ marginBottom: "8px", color: "var(--color-g)" }}>
          Explore data aggregator
        </h2>
        <i>
          Select an event to aggregate, then press &quot;Query Data&quot; to
          fetch all data related to it.
        </i>
        <br />
        <i>
          Once it retrieves everything you can aggregate and push the new data
          with &quot;Aggregate&quot;.
        </i>
        <div className="selector">
          <Select
            style={{ width: "280px" }}
            options={transformedEvents}
            optionFormatter={getEventPrettyName}
            current={eventId}
            callback={setEventId}
          />
          <Button
            onClick={() => beginDataQuery(10, eventId)}
            text="Query Data"
          />
        </div>
        <div
          style={{ height: "120px", display: "flex", flexDirection: "column" }}
        >
          {isOk && <div className="aggregation-complete" />}
          {!isOk && (
            <>
              <Flex style={{ flexDirection: "column", marginBottom: "16px" }}>
                <div>{queryDataState.foundKeys} found</div>
                <div>{queryDataState.queriedKeys} queried</div>
                <div>{queryDataState.savedKeys} saved</div>
              </Flex>
              <div className="loader-title">
                {queryDataState.loadingPercent}%
              </div>
              <div className="loader-bar">
                <div
                  className="loader-bar-fill"
                  style={{ width: `${queryDataState.loadingPercent}%` }}
                />
              </div>
            </>
          )}
        </div>
        <Flex style={{ justifyContent: "center" }}>
          <Button
            disabled={
              queryDataState.foundKeys !== queryDataState.savedKeys ||
              queryDataState.savedKeys === 0
            }
            onClick={doAggregation}
            text="Aggregate"
          />
          <Button onClick={() => history.push(`/explore`)} text="Go Back" />
        </Flex>
      </div>
    </Section>
  );
}
