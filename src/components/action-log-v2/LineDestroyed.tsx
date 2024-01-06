import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineDestroyed(props: ActionLogLineProps) {
  const { line } = props;

  if (line.type !== "DESTROYED") return <></>;

  return (
    <>
      <div className="log-line">
        {line.abilityId ? (
          <>
            <LogCard grpId={line.sourceGrpId} />
            &apos;s&nbsp;
            <LogAbility abId={line.abilityId} />
          </>
        ) : (
          <LogCard grpId={line.sourceGrpId} />
        )}
        &nbsp;destroyed&nbsp;
        <LogCard grpId={line.grpId} />
      </div>
    </>
  );
}
