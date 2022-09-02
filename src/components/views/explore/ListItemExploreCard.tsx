import { database } from "mtgatool-shared";
import getWinrateClass from "../../../utils/getWinrateClass";
import CardTile from "../../CardTile";
import { ExploreCardData } from "./doExploreAggregation";

interface ListItemExploreCardProps {
  data: ExploreCardData;
}

export default function ListItemExploreCard(props: ListItemExploreCardProps) {
  const { data } = props;

  const cardObj = database.card(data.id);

  return (
    <div className="list-explore-card">
      <div className="card-space">
        <CardTile
          indent="a"
          isHighlighted={false}
          isSideboard={false}
          showWildcards={false}
          card={cardObj}
          key={`explore-card-list-${data.id}`}
          quantity={{ type: "NUMBER", quantity: data.avgQuantity }}
        />
      </div>
      <div
        className={`card-winrate ${getWinrateClass(data.winrate / 100, true)}`}
      >
        {data.winrate === -1 ? "-" : `${data.winrate}%`}
      </div>
      <div
        className={`card-firsthand ${getWinrateClass(
          data.initHandWinrate / 100,
          true
        )}`}
      >
        {data.initHandWinrate === -1 ? "-" : `${data.initHandWinrate}%`}
      </div>
      <div
        className={`card-sidedin ${getWinrateClass(
          data.sideInWinrate / 100,
          true
        )}`}
      >
        {data.sideInWinrate === -1 ? "-" : `${data.sideInWinrate}%`}
      </div>
      <div
        className={`card-sidedout ${getWinrateClass(
          data.sideOutWinrate / 100,
          true
        )}`}
      >
        {data.sideOutWinrate === -1 ? "-" : `${data.sideOutWinrate}%`}
      </div>
      <div className="card-avgturn">{data.avgTurnUsed.toFixed(2)}</div>
      <div className="card-avgfirst">{data.avgFirstTurn.toFixed(2)}</div>
    </div>
  );
}
