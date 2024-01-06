import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineZoneReturn(props: ActionLogLineProps) {
  const { line } = props;

  if (line.type !== "ZONE_RETURN") return <></>;

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
        &nbsp;returned&nbsp;
        <LogCard grpId={line.grpId} />
        &nbsp;to&nbsp;{line.zone}
      </div>
    </>
  );
}
