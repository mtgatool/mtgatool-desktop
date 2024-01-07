import getPlayerBySeat from "./getPlayerBySeat";
import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineTarget(props: ActionLogLineProps) {
  const { line, players } = props;

  if (line.type !== "TARGET") return <></>;

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        {line.abilityId ? (
          <>
            <LogCard grpId={line.sourceGrpId} />
            &apos;s&nbsp;
            <LogAbility abId={line.abilityId} />
          </>
        ) : (
          <LogCard grpId={line.sourceGrpId} />
        )}
        &nbsp;targeted&nbsp;
        {line.targetType === "PLAYER" ? (
          getPlayerBySeat(line.targetId, players)
        ) : (
          <LogCard grpId={line.targetId} />
        )}
      </div>
    </>
  );
}
