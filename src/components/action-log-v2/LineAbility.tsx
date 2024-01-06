import LogAbility from "./LogAbility";
import LogCard from "./LogCard";
import { ActionLogLineProps } from "./types";

export default function LineAbility(props: ActionLogLineProps) {
  const { line } = props;

  if (line.type !== "ABILITY") return <></>;

  return (
    <>
      <div className={`log-line seat-${line.seat}`}>
        <LogCard grpId={line.sourceGrpId} />
        &apos;s&nbsp;
        {line.abilityId ? <LogAbility abId={line.abilityId} /> : "ability"}
      </div>
    </>
  );
}
