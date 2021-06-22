/* eslint-disable @typescript-eslint/no-empty-function */
import { useState, useEffect, useMemo, CSSProperties } from "react";
import { useSelector } from "react-redux";
import { database } from "mtgatool-shared";
import NoCard from "../assets/images/nocard.png";
import { AppState } from "../redux/stores/rendererStore";
import OwnershipStars from "./OwnershipStars";
import getFrontUrl from "../utils/getFrontUrl";
import getBackUrl from "../utils/getBackUrl";
import isCardDfc from "../utils/isCardDfc";
import { CARD_SIZE_RATIO } from "../common/static";

export default function CardHover(): JSX.Element {
  const { grpId, opacity } = useSelector((state: AppState) => state.hover);

  const quality = useSelector((state: AppState) => state.settings.cardsQuality);
  const hoverSize = useSelector(
    (state: AppState) => state.settings.cardsSizeHoverCard
  );
  const card = database.card(grpId);
  const [frontLoaded, setFrontLoaded] = useState(0);
  const [backLoaded, setBackLoaded] = useState(0);
  const [frontUrl, setFrontUrl] = useState("");
  const [backUrl, setBackUrl] = useState("");

  const size = 100 + hoverSize * 15;

  const styleFront = useMemo((): CSSProperties => {
    return {
      width: `${size}px`,
      height: `${size / CARD_SIZE_RATIO}px`,
      top: `calc(100% - ${size / CARD_SIZE_RATIO + 32}px)`,
      opacity: opacity,
      backgroundImage: `url(${frontLoaded == grpId ? frontUrl : NoCard})`,
    };
  }, [frontUrl, opacity, grpId, frontLoaded, size]);

  const styleDfc = useMemo((): CSSProperties => {
    const cardObj = database.card(grpId);
    let op = opacity;
    if (!(cardObj?.dfcId && isCardDfc(grpId))) {
      op = 0;
    }

    return {
      width: `${size}px`,
      right: `${size + 48}px`,
      height: `${size / CARD_SIZE_RATIO}px`,
      top: `calc(100% - ${size / CARD_SIZE_RATIO + 32}px)`,
      opacity: op,
      backgroundImage: `url(${backLoaded == grpId ? backUrl : NoCard})`,
    };
  }, [backUrl, opacity, grpId, backLoaded, size]);

  useEffect(() => {
    // Reset the image, begin new loading and clear state
    const front = getFrontUrl(grpId, quality);
    const back = getBackUrl(grpId, quality);
    const img = new Image();
    img.src = front;
    img.onload = (): void => {
      setFrontUrl(front);
      setFrontLoaded(grpId);
    };
    const imgb = new Image();
    imgb.src = back;
    imgb.onload = (): void => {
      if (back) {
        setBackUrl(back);
        setBackLoaded(grpId);
      }
    };
    return (): void => {
      img.onload = (): void => {};
      imgb.onload = (): void => {};
    };
  }, [grpId, quality]);

  return (
    <>
      <div style={styleDfc} className="card-hover-dfc" />
      <div style={styleFront} className="card-hover-main">
        {card ? (
          <div className="ownership-stars-container">
            <OwnershipStars card={card} />
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}
