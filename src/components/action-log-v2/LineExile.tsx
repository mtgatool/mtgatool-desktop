import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineExile(props: ActionLogLineProps) {
  const { line } = props;

  if (line.type !== "EXILE") return <></>;

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
        &nbsp;exiled&nbsp;
        <LogCard grpId={line.grpId} />
      </div>
    </>
  );
}
