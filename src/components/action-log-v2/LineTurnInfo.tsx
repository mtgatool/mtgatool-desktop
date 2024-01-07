import { toMMSS } from "../../utils/dateTo";
import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

const phasesMap: Record<string, string> = {
  Phase_None: "None",
  Phase_Beginning: "Beginning Phase",
  Phase_Main1: "First Main Phase",
  Phase_Combat: "Combat",
  Phase_Main2: "Second Main Phase",
  Phase_Ending: "End Phase",
};

export default function LineTurnInfo(props: ActionLogLineProps) {
  const { line, players, timeStart } = props;

  if (line.type !== "TURN_INFO") return <></>;

  const timeDiff = toMMSS(Math.round((line.timestamp - timeStart) / 1000));

  return (
    <>
      {line.subType === "BEGIN" && (
        <div className="turn-info begin">
          <div>
            Turn {line.turnNumber}
            <span className="time">+{timeDiff}</span>
          </div>
          <div className="name">
            {getPlayerBySeat(line.activePlayer || 0, players)}
          </div>
        </div>
      )}

      {line.subType === "PHASE" && line.phase && (
        <div className="turn-info phase">{phasesMap[line.phase]}</div>
      )}
    </>
  );
}
