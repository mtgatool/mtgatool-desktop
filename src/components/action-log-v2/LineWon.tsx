import getPlayerBySeat from "./getPlayerBySeat";
import { ActionLogLineProps } from "./types";

export default function LineWin(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "WIN") return <></>;

  const playerName = getPlayerBySeat(line.seat || 0, players);

  return (
    <>
      <div className="log-line winner">{playerName}&nbsp;won!</div>
    </>
  );
}
