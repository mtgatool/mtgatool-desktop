import Automerge from "automerge";
import { base64ToBinaryDocument } from "mtgatool-db";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

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

  useEffect(() => {
    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    const finalEventList: string[] = [];

    async function queryDayKeys(day: number): Promise<string[]> {
      const dayKeys = await window.toolDb.queryKeys(`explore-${day}-`);
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
  }, []);

  const crdt = useRef<Automerge.FreezeObject<Record<string, number>>>(
    Automerge.init({})
  );
  const data = useRef<Record<string, DbMatch>>({});

  const [queriedIds, setQueriedIds] = useState<string[] | null>(null);

  const handleExploreData = useCallback(
    (msg) => {
      if (msg && msg.type === "crdt") {
        const doc = Automerge.load<Record<string, number>>(
          base64ToBinaryDocument(msg.doc)
        );

        try {
          crdt.current = Automerge.merge(crdt.current, doc);
          setQueriedIds([]);
        } catch (e) {
          console.warn(e);
        }
      }
    },
    [crdt]
  );

  const beginDataQuery = useCallback(
    (_day, _eventId) => {
      crdt.current = Automerge.init({});
      data.current = {};
      setIsOk(false);
      setQueriedIds(null);

      function queryForEvent(ev: string) {
        for (let i = 0; i < _day; i += 1) {
          const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
          const queryKey = `explore-${currentDay - i}-${ev}`;
          window.toolDb.addKeyListener(queryKey, handleExploreData);
          window.toolDb.subscribeData(queryKey);
        }
      }

      if (_eventId === "aggregated-standard") {
        queryForEvent("Ladder");
        queryForEvent("Play");
        queryForEvent("Constructed_BestOf3");
        queryForEvent("Constructed_Event_2020");
        queryForEvent("Constructed_Event_2021");
        queryForEvent("Constructed_Event_v2");
        queryForEvent("Traditional_Cons_Event_2020");
        queryForEvent("Traditional_Cons_Event_2021");
        queryForEvent("Traditional_Cons_Event_2022");
        queryForEvent("Traditional_Cons_Event_2023");
        queryForEvent("Traditional_Ladder");
        queryForEvent("Standard_Challenge_20230421");
      } else if (_eventId === "aggregated-historic") {
        queryForEvent("Historic_Ladder");
        queryForEvent("Historic_Play");
        queryForEvent("Historic_Event_v2");
        queryForEvent("Historic_Event");
        queryForEvent("Traditional_Historic_Event");
        queryForEvent("Traditional_Historic_Play");
        queryForEvent("Traditional_Historic_Ladder");
      } else if (_eventId === "aggregated-alchemy") {
        queryForEvent("Alchemy_Ladder");
        queryForEvent("Alchemy_Play");
        queryForEvent("Alchemy_Event");
        queryForEvent("Traditional_Alchemy_Event_2022");
        queryForEvent("Traditional_Alchemy_Event_2023");
        queryForEvent("Traditional_Alchemy_Event");
        queryForEvent("Traditional_Alchemy_Play");
        queryForEvent("Traditional_Alchemy_Ladder");
      } else if (_eventId === "aggregated-explorer") {
        queryForEvent("Explorer_Ladder");
        queryForEvent("Explorer_Play");
        queryForEvent("Explorer_Event");
        queryForEvent("Explorer_Event_v2");
        queryForEvent("Traditional_Explorer_Event");
        queryForEvent("Traditional_Explorer_Play");
        queryForEvent("Traditional_Explorer_Ladder");
      } else {
        queryForEvent(_eventId);
      }
    },
    [handleExploreData]
  );

  useEffect(() => {
    if (queriedIds) {
      Object.keys(crdt.current)
        .filter((k) => !queriedIds.includes(k))
        .splice(0, 1)
        .forEach((id) => {
          window.toolDb.getData(id).then((d) => {
            data.current[id] = d;
            setQueriedIds([...queriedIds, id]);
          });
        });
    }
  }, [crdt, queriedIds]);

  const doAggregation = useCallback(() => {
    const aggregatedData = doExploreAggregation(Object.values(data.current));
    if (aggregatedData.data && Object.values(aggregatedData.data).length > 0) {
      window.toolDb
        .putData<DbExploreAggregated>(`exploredata-${eventId}`, aggregatedData)
        .then((res) => {
          if (res) {
            setIsOk(true);
          }
        })
        .catch(console.warn);
    }
  }, [eventId, data]);

  const loadingPercent =
    Object.keys(data.current).length > 0
      ? Math.round(
          (100 / Object.keys(crdt.current).length) *
            Object.keys(data.current).length
        )
      : 0;

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
                <div>{Object.keys(crdt.current).length} found</div>
                <div>{queriedIds?.length || 0} queried</div>
                <div>{Object.keys(data.current).length} saved</div>
              </Flex>
              <div className="loader-title">{loadingPercent}%</div>
              <div className="loader-bar">
                <div
                  className="loader-bar-fill"
                  style={{ width: `${loadingPercent}%` }}
                />
              </div>
            </>
          )}
        </div>
        <Flex style={{ justifyContent: "center" }}>
          <Button
            disabled={
              Object.keys(crdt.current).length !==
                Object.keys(data.current).length ||
              Object.keys(data.current).length === 0
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
