import useCard from "../../hooks/useCard";
import useHoverCard from "../../hooks/useHoverCard";

interface LogCardProps {
  grpId: number;
}

export default function LogCard(props: LogCardProps): JSX.Element {
  const { grpId } = props;
  const cardObj = useCard(grpId);
  const cardName = cardObj?.Name;

  const [hoverIn, hoverOut] = useHoverCard(grpId);

  return (
    <span onMouseEnter={hoverIn} onMouseLeave={hoverOut} className="card">
      {cardName}
    </span>
  );
}
