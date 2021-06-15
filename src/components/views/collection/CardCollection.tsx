import { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import useHoverCard from "../../../hooks/useHoverCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { getCardImage } from "../../../utils/getCardArtCrop";
import openScryfallCard from "../../../utils/openScryfallCard";
import OwnershipStars from "../../OwnershipStars";

interface CardCollectionProps {
  card: CardsData;
}

export default function CardCollection(props: CardCollectionProps) {
  const { card } = props;
  const onClick = useCallback(() => {
    openScryfallCard(card);
  }, [card]);
  const containerEl = useRef<HTMLDivElement>(null);

  const [hoverIn, hoverOut] = useHoverCard(card.id);

  const cardSize =
    100 + useSelector((state: AppState) => state.settings.cardsSize) * 15;
  const cardsQuality = useSelector(
    (state: AppState) => state.settings.cardsQuality
  );

  return (
    <div
      ref={containerEl}
      title={`open ${card.name} in Scryfall (browser)`}
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ width: "100%", maxWidth: `${cardSize}px` }}>
        <OwnershipStars card={card} />
      </div>
      <div
        className="inventory-card"
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        style={{ width: `${cardSize}px` }}
      >
        <img
          className="inventory-card-img"
          style={{ width: `${cardSize}px` }}
          src={getCardImage(card, cardsQuality)}
        />
      </div>
    </div>
  );
}
