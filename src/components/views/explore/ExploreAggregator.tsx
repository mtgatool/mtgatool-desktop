import { useCallback, useEffect, useRef, useState } from "react";

import Automerge from "automerge";
import { base64ToBinaryDocument } from "mtgatool-db";

import { getEventPrettyName } from "mtgatool-shared";
import Button from "../../ui/Button";
import { DbMatch } from "../../../types/dbTypes";
import doExploreAggregation, {
  DbExploreAggregated,
} from "./doExploreAggregation";
import Select from "../../ui/Select";
import Flex from "../../Flex";
import transformEventsList from "./transformEventsList";

interface ExploreAggregatorProps {
  day: number;
  eventsList: string[];
  onExit: () => void;
}

/**
 * Aggregates data into explore
 * Only meant to be used when there is no data for what we are looking for.
 */
export default function ExploreAggregator(props: ExploreAggregatorProps) {
  const [isOk, setIsOk] = useState(false);

  const [eventId, setEventId] = useState<string>("Ladder");

  const { day, onExit, eventsList } = props;

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
      for (let i = 0; i < _day; i += 1) {
        const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
        const queryKey = `explore-${currentDay - i}-${_eventId}`;
        window.toolDb.addKeyListener(queryKey, handleExploreData);
        window.toolDb.subscribeData(queryKey);
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
    window.toolDb
      .putData<DbExploreAggregated>(`exploredata-${eventId}`, aggregatedData)
      .then((res) => {
        if (res) {
          setIsOk(true);
        }
      })
      .catch(console.warn);
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
    <div className="explore-aggregator">
      <h2 style={{ marginBottom: "8px", color: "var(--color-g)" }}>
        Explore data aggregator
      </h2>
      <i>
        Select an event to aggregate, then press &quot;Query Data&quot; to fetch
        all data related to it.
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
          onClick={() => beginDataQuery(day, eventId)}
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
        <Button onClick={onExit} text="Go Back" />
      </Flex>
    </div>
  );
}
