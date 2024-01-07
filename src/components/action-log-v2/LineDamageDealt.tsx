import getPlayerBySeat from "./getPlayerBySeat";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineDamageDealt(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "DAMAGE_DEALT") return <></>;

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        <LogCard grpId={line.sourceGrpId} />
        &nbsp;dealt&nbsp;{line.amount}&nbsp;damage to&nbsp;
        {line.targetType === "PLAYER" ? (
          getPlayerBySeat(line.targetId, players)
        ) : (
          <LogCard grpId={line.targetId} />
        )}
      </div>
    </>
  );
}
