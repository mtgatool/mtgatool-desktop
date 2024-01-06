import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineZonePut(props: ActionLogLineProps) {
  const { line } = props;

  if (line.type !== "ZONE_PUT") return <></>;

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
        &nbsp;put&nbsp;
        <LogCard grpId={line.grpId} />
        &nbsp;in&nbsp;{line.zone}
      </div>
    </>
  );
}
