/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

import { getEventPrettyName } from "mtgatool-shared";
import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import Flex from "../../Flex";

import Button from "../../ui/Button";

import Section from "../../ui/Section";
import Select from "../../ui/Select";

import transformEventsList from "./transformEventsList";

export default function ViewExploreHome() {
  const history = useHistory();

  const [eventsList, setEventsList] = useState<string[]>([]);
  const [eventFilter, setEventFilterState] = useState("Ladder");

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

  const doSearch = useCallback(() => {
    history.push(`/explore/${eventFilter}`);
  }, [eventFilter]);

  // Get default events list to filter
  const transformedEvents = transformEventsList(eventsList);

  return (
    <Section style={{ margin: "16px 0", flexDirection: "column" }}>
      <Flex style={{ justifyContent: "center", height: "48px" }}>
        <Select
          style={{ width: "280px" }}
          options={transformedEvents}
          optionFormatter={getEventPrettyName}
          current={eventFilter}
          callback={setEventFilterState}
        />
        <Button text="Search" onClick={doSearch} />
      </Flex>

      <Flex
        style={{
          textAlign: "center",
          flexDirection: "column",
          lineHeight: "32px",
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
    </Section>
  );
}
