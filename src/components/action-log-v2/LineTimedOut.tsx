import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

export default function LineTimedOut(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "TIMED_OUT") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className={`log-line seat-${line.seat} result`}>
        {playerName}&nbsp;timed out.
      </div>
    </>
  );
}
