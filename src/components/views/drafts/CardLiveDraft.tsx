import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import LoadingCard from "../../../assets/images/loadingcard.png";
import { CARD_SIZE_RATIO } from "../../../common/static";
import useCard from "../../../hooks/useCard";
import useHoverCard from "../../../hooks/useHoverCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { getCardImage } from "../../../utils/getCardArtCrop";
import getCssQuality from "../../../utils/getCssQuality";

interface CardLiveDraftProps {
  grpId: number;
  selected?: boolean;
  /** Fixed width in px; defaults to the user's card-size setting. */
  size?: number;
  onClick?: () => void;
}

export default function CardLiveDraft(props: CardLiveDraftProps) {
  const { grpId, selected, size, onClick } = props;

  const [hoverIn, hoverOut] = useHoverCard(grpId);
  const [cardUrl, setCardUrl] = useState<string>();

  const settingsSize =
    100 + useSelector((state: AppState) => state.settings.cardsSize) * 15;
  const cardSize = size ?? settingsSize;
  const cardsQuality = useSelector(
    (state: AppState) => state.settings.cardsQuality
  );

  const card = useCard(grpId);

  const style = useMemo((): CSSProperties => {
    return {
      backgroundImage: `url(${cardUrl || LoadingCard})`,
    };
  }, [cardUrl]);

  useEffect(() => {
    if (!card) return undefined;
    let cancelled = false;
    const img = new Image();
    const imageUrl = getCardImage(card, cardsQuality);
    img.src = imageUrl;
    img.onload = (): void => {
      if (!cancelled) setCardUrl(imageUrl);
    };
    return () => {
      cancelled = true;
    };
  }, [card, cardsQuality]);

  return (
    <div
      title={`${card?.Name || ""}`}
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        className={`inventory-card${selected ? " draft-pick-selected" : ""}`}
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
        {selected && <div className="draft-pick-selected-badge">PICK</div>}
      </div>
    </div>
  );
}
