import useAbility from "../../hooks/useAbility";

interface LogAbilityProps {
  abId: number;
}

export default function LogAbility(props: LogAbilityProps): JSX.Element {
  const { abId } = props;
  const desc = useAbility(abId);

  return (
    <span title={desc} className="ability">
      ability
    </span>
  );
}
