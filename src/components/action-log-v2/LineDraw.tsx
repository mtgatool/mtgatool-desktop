import getPlayerBySeat from "./getPlayerBySeat";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineDraw(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "DRAW") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        {playerName}&nbsp;drew&nbsp;
        {line.grpId ? <LogCard grpId={line.grpId} /> : "a card"}
      </div>
    </>
  );
}
