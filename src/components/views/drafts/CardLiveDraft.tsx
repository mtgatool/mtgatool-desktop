import { database } from "mtgatool-shared";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import LoadingCard from "../../../assets/images/loadingcard.png";
import { CARD_SIZE_RATIO } from "../../../common/static";
import useHoverCard from "../../../hooks/useHoverCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { getCardImage } from "../../../utils/getCardArtCrop";
import getCssQuality from "../../../utils/getCssQuality";

interface CardLiveDraftProps {
  grpId: number;
  onClick: () => void;
}

export default function CardLiveDraft(props: CardLiveDraftProps) {
  const { grpId, onClick } = props;
  const containerEl = useRef<HTMLDivElement>(null);

  const [hoverIn, hoverOut] = useHoverCard(grpId);
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
    const card = database.card(grpId);
    if (card) {
      const imageUrl = getCardImage(card, cardsQuality);
      img.src = imageUrl;
      img.onload = (): void => {
        setCardUrl(imageUrl);
      };
    }
  }, [grpId]);

  const card = database.card(grpId);

  return (
    <div
      ref={containerEl}
      title={`${card?.Name || ""}`}
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        className="inventory-card"
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
        style={{
          margin: "0 6px",
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
