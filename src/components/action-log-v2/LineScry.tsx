import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

export default function LineScry(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "SCRY") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        {playerName}&nbsp;scry&nbsp;{line.amount}, put&nbsp;{line.top.length}
        &nbsp;on top and&nbsp;{line.bottom.length}&nbsp;on bottom.
      </div>
    </>
  );
}
