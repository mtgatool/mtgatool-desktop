import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

export default function LineConceded(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "CONCEDED") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className="log-line result">{playerName}&nbsp;conceded.</div>
    </>
  );
}
