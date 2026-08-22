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
import useCard from "../../../hooks/useCard";
import useHoverCard from "../../../hooks/useHoverCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardsData } from "../../../types/collectionTypes";
import {
  getCardImage,
  getSubstituteArtNote,
} from "../../../utils/getCardArtCrop";
import getCssQuality from "../../../utils/getCssQuality";
import openScryfallCard from "../../../utils/openScryfallCard";
import OwnershipStars from "../../OwnershipStars";

interface CardCollectionProps {
  card: CardsData;
}

export default function CardCollection(props: CardCollectionProps) {
  const { card } = props;
  const onClick = useCallback(() => {
    openScryfallCard(card.id);
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

  const cardObj = useCard(card.id);

  // Non-null only when the image is another printing's art, which the player
  // is told about rather than left to wonder at.
  const substituteNote = useMemo(
    () => getSubstituteArtNote(cardObj),
    [cardObj]
  );

  // Built from the resolved card, not from its grpId. getCardImage can look a
  // grpId up itself, but that read is synchronous and the card has not arrived
  // on the first render — it produced a URL with an undefined set and collector
  // number, which Scryfall answers with a placeholder. Depending on cardObj
  // also means the effect re-runs when the card lands, which the empty
  // dependency list here never did.
  useEffect(() => {
    if (!cardObj) return;
    const img = new Image();
    const imageUrl = getCardImage(cardObj, cardsQuality);
    img.src = imageUrl;
    img.onload = (): void => {
      setCardUrl(imageUrl);
    };
  }, [cardObj, cardsQuality]);

  return (
    <div
      ref={containerEl}
      title={`open ${cardObj?.Name} in Scryfall (browser)`}
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ width: "100%", maxWidth: `${cardSize}px` }}>
        {cardObj && <OwnershipStars card={cardObj} />}
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
        {substituteNote && (
          <div className="inventory-card-substitute">
            <span title={substituteNote}>
              <i>?</i>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
