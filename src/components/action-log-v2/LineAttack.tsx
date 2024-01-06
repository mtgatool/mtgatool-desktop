import getPlayerBySeat from "./getPlayerBySeat";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineAttack(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "ATTACK") return <></>;

  return (
    <div className="log-line">
      {getPlayerBySeat(line.seat, players)}
      &nbsp;attacked with &nbsp;
      {line.grpIds.map((grpId, index) => {
        const len = line.grpIds.length;
        return (
          <>
            <LogCard key={grpId} grpId={grpId} />
            {index < len - 2 && len > 2 && <>,&nbsp;</>}
            {index === len - 2 && <>&nbsp;and&nbsp;</>}
          </>
        );
      })}
      &nbsp;to&nbsp;
      {line.targetType === "PLAYER" ? (
        getPlayerBySeat(line.targetId, players)
      ) : (
        <LogCard grpId={line.targetId} />
      )}
    </div>
  );
}
