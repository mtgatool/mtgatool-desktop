import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

export default function LineModifiedLife(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "MODIFIED_LIFE") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        {playerName}&nbsp;{line.delta < 0 ? "lost" : "gained"}&nbsp;
        {Math.abs(line.delta)}&nbsp;life ({line.total}).
      </div>
    </>
  );
}
