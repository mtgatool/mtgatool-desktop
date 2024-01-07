import { database } from "mtgatool-shared";

interface LogAbilityProps {
  abId: number;
}

export default function LogAbility(props: LogAbilityProps): JSX.Element {
  const { abId } = props;
  const desc = database.ability(abId);

  return (
    <span title={desc} className="ability">
      ability
    </span>
  );
}
