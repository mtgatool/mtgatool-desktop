import getPlayerBySeat from "./getPlayerBySeat";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineCast(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "CAST") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className="log-line">
        {playerName}&nbsp;cast&nbsp;
        {line.grpId ? <LogCard grpId={line.grpId} /> : "a spell"}
      </div>
    </>
  );
}
