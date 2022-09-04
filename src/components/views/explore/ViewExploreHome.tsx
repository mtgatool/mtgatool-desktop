/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import getEventExplorerSection from "../../../utils/getEventExplorerSection";

import Flex from "../../Flex";

import Section from "../../ui/Section";
import ExploreEvent from "./ExploreEvent";

const eventsBlacklist = (ev: string) =>
  !ev.includes("NPE_") &&
  !ev.includes("ColorChallenge_") &&
  !ev.includes("DirectGame") &&
  !ev.includes("Decathlon10_TurboDraft_20211230") &&
  !ev.includes("Decathlon1_Alchemy_20211218") &&
  !ev.includes("Decathlon4_NewPrecons_20211221") &&
  !ev.includes("MWM_Cascade_20220208") &&
  !ev.includes("MWM_HistoricPauper_20211221") &&
  !ev.includes("MWM_SlowStart_20220125") &&
  !ev.includes("UnbrokenBlade_20220318");

export default function ViewExploreHome() {
  const history = useHistory();
  const [eventsList, setEventsList] = useState<string[]>([]);

  useEffect(() => {
    const finalEventList: string[] = [];

    async function queryKeys(): Promise<string[]> {
      const dayKeys = await window.toolDb.queryKeys(`exploredata-`);
      return dayKeys?.map((k: string) => k.slice(`exploredata-`.length)) || [];
    }

    async function doQueryLoop() {
      const dayKeys = await queryKeys();
      finalEventList.push(...dayKeys);

      const fixedList = finalEventList.filter(eventsBlacklist);

      setEventsList(Array.from(new Set(fixedList)));
    }

    doQueryLoop();
  }, []);

  const sortedEventsList = eventsList.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return (
    <Section style={{ margin: "16px 0 32px 0", flexDirection: "column" }}>
      <h2 style={{ textAlign: "center" }}>Explore Events</h2>
      <Flex
        style={{
          textAlign: "center",
          flexDirection: "column",
          lineHeight: "32px",
          marginBottom: "16px",
        }}
      >
        <i>
          Want to contribute?{" "}
          <a
            className="link"
            onClick={() => {
              history.push("/aggregator");
            }}
          >
            try the aggregator!
          </a>
        </i>
      </Flex>
      <div className="explore-events-mosaic">
        <div className="mosaic-column">
          {sortedEventsList.length === 0 && (
            <Flex style={{ flexDirection: "column" }}>
              {new Array(16).fill("").map((ev, i) => (
                <ExploreEvent key={`explore-event-${i}`} eventId="" />
              ))}
            </Flex>
          )}
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Custom")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Ranked")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>{" "}
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Limited")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>
        </div>
        <div className="mosaic-column">
          {sortedEventsList.length === 0 && (
            <Flex style={{ flexDirection: "column" }}>
              {new Array(16).fill("").map((ev, i) => (
                <ExploreEvent key={`explore-event-${i}`} eventId="" />
              ))}
            </Flex>
          )}
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Constructed")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Play")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>
          <Flex style={{ flexDirection: "column" }}>
            {sortedEventsList
              .filter((ev) => getEventExplorerSection(ev) === "Other")
              .map((ev) => (
                <ExploreEvent key={`explore-event-${ev}`} eventId={ev} />
              ))}
          </Flex>
        </div>
      </div>
    </Section>
  );
}
