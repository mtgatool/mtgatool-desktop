import { PriorityTimers } from "mtgatool-shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toHHMMSS, toMMSS } from "../utils/dateTo";

const CLOCK_MODE_BOTH = 0;
const CLOCK_MODE_ELAPSED = 1;
const CLOCK_MODE_CLOCK = 2;

interface ClockProps {
  matchBeginTime: Date;
  priorityTimers: PriorityTimers;
  turnPriority: number;
  oppName: string;
  playerSeat: number;
}

export default function Clock(props: ClockProps): JSX.Element {
  const [clockMode, setClockMode] = useState(CLOCK_MODE_BOTH);
  const [now, setNow] = useState(new Date());
  const { matchBeginTime, priorityTimers, turnPriority, oppName, playerSeat } =
    props;

  const handleClockPrev = useCallback((): void => {
    if (clockMode <= CLOCK_MODE_BOTH) {
      setClockMode(CLOCK_MODE_CLOCK);
    } else {
      setClockMode(clockMode - 1);
    }
  }, [clockMode]);

  const handleClockNext = useCallback((): void => {
    if (clockMode >= CLOCK_MODE_CLOCK) {
      setClockMode(CLOCK_MODE_BOTH);
    } else {
      setClockMode(clockMode + 1);
    }
  }, [clockMode]);

  // update clock display by changing "now" state every 250ms
  useEffect(() => {
    const timerID = setInterval(() => {
      setNow(new Date());
    }, 250);
    return (): void => {
      clearInterval(timerID);
    };
  });

  // Memoize title computation
  const clockTitle = useMemo((): JSX.Element => {
    let p1name = oppName;
    let p2name = "You";
    if (playerSeat === 1) {
      p1name = "You";
      p2name = oppName;
    }
    if (clockMode === CLOCK_MODE_BOTH) {
      const className1 = `clock-pname-1 ${
        turnPriority === 1 ? "pname-priority" : ""
      }`;
      const className2 = `clock-pname-2 ${
        turnPriority === 2 ? "pname-priority" : ""
      }`;
      return (
        <>
          <div className={className1}>{p1name}</div>
          <div className={className2}>{p2name}</div>
        </>
      );
    }
    if (turnPriority === playerSeat) {
      return <>You have priority.</>;
    }
    return <>{`${oppName} has priority.`}</>;
  }, [oppName, clockMode, playerSeat, turnPriority]);

  // Clock Mode BOTH
  const lastDurationInSec = Math.floor(
    // Eh, not sure about this one
    (now.getTime() - new Date(priorityTimers.last).getTime()) / 1000
  );
  let duration1 = Math.floor(priorityTimers.timers[1] / 1000);
  if (turnPriority === 1 && duration1 > 0) {
    duration1 += lastDurationInSec;
  }
  let duration2 = Math.floor(priorityTimers.timers[2] / 1000);
  if (turnPriority === 2 && duration2 > 0) {
    duration2 += lastDurationInSec;
  }

  // Clock Mode ELAPSED
  const elapsedDuration = Math.floor(
    (now.getTime() - matchBeginTime.getTime()) / 1000
  );

  return (
    <div className="overlay-clock-container click-on">
      <div className="clock-prev" onClick={handleClockPrev} />
      <div className="clock-turn">{clockTitle}</div>
      <div className="clock-elapsed">
        {clockMode === CLOCK_MODE_BOTH && (
          <>
            <div className="clockPriority-1">{toMMSS(duration1)}</div>
            <div className="clockPriority-2">{toMMSS(duration2)}</div>
          </>
        )}
        {clockMode === CLOCK_MODE_ELAPSED && toHHMMSS(elapsedDuration)}
        {clockMode === CLOCK_MODE_CLOCK && now.toLocaleTimeString()}
      </div>
      <div className="clock-next" onClick={handleClockNext} />
    </div>
  );
}
