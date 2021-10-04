import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import LoadingCard from "../../../assets/images/loadingcard.png";
import { CARD_SIZE_RATIO } from "../../../common/static";
import useHoverCard from "../../../hooks/useHoverCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import { getCardImage } from "../../../utils/getCardArtCrop";
import getCssQuality from "../../../utils/getCssQuality";
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
  const [cardUrl, setCardUrl] = useState<string>();

  const cardSize =
    100 + useSelector((state: AppState) => state.settings.cardsSize) * 15;
  const cardsQuality = useSelector(
    (state: AppState) => state.settings.cardsQuality
  );

  const style = useMemo((): CSSProperties => {
    return {
      backgroundImage: `url(${cardUrl || LoadingCard})`,
    };
  }, [cardUrl]);

  useEffect(() => {
    const img = new Image();
    const imageUrl = getCardImage(card, cardsQuality);
    img.src = imageUrl;
    img.onload = (): void => {
      setCardUrl(imageUrl);
    };
  }, []);

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
        style={{
          width: `${cardSize}px`,
          height: `${Math.round(cardSize / CARD_SIZE_RATIO)}px`,
        }}
      >
        <div
          className={`inventory-card-img ${getCssQuality()}`}
          style={{ ...style }}
        />
      </div>
    </div>
  );
}
