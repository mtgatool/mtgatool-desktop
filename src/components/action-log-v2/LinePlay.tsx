import getPlayerBySeat from "./getPlayerBySeat";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LinePlay(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "PLAY") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className="log-line">
        {playerName}&nbsp;played&nbsp;
        {line.grpId ? <LogCard grpId={line.grpId} /> : "a land"}
      </div>
    </>
  );
}
