import { useCallback, useState, CSSProperties, useEffect } from "react";
import {
  constants,
  Deck,
  DbCardData,
  Rarity,
  cardHasType,
} from "mtgatool-shared";
import {
  DEFAULT_TILE,
  LANDS_HACK,
} from "mtgatool-shared/dist/shared/constants";
import getRankColorClass from "../utils/getRankColorClass";
import openScryfallCard from "../utils/openScryfallCard";
import { getCardArtCrop } from "../utils/getCardArtCrop";
import useHoverCard from "../hooks/useHoverCard";

import typeLand from "../assets/images/type_land.png";
import getWildcardsMissing from "../utils/getWildcardsMissing";

// import gray from "../assets/images/gray.png";

const { CARD_RARITIES, COLORS_ALL, FACE_SPLIT_FULL, FACE_ADVENTURE_MAIN } =
  constants;

const mana: Record<string, string> = {};
mana.w = "mana-w";
mana.u = "mana-u";
mana.b = "mana-b";
mana.r = "mana-r";
mana.g = "mana-g";
mana.c = "mana-c";
mana.wu = "mana-wu";
mana.wb = "mana-wb";
mana.ur = "mana-ur";
mana.ub = "mana-ub";
mana.br = "mana-br";
mana.bg = "mana-bg";
mana.gw = "mana-gw";
mana.gu = "mana-gu";
mana.rw = "mana-rw";
mana.rg = "mana-rg";
mana.x = "mana-x";
mana.wp = "mana-wp";
mana.up = "mana-up";
mana.bp = "mana-bp";
mana.rp = "mana-rp";
mana.gp = "mana-gp";
mana["0"] = "mana-0";
mana["1"] = "mana-1";
mana["2"] = "mana-2";
mana["3"] = "mana-3";
mana["4"] = "mana-4";
mana["5"] = "mana-5";
mana["6"] = "mana-6";
mana["7"] = "mana-7";
mana["8"] = "mana-8";
mana["9"] = "mana-9";
mana["10"] = "mana-10";
mana["11"] = "mana-11";
mana["12"] = "mana-12";
mana["13"] = "mana-13";
mana["14"] = "mana-14";
mana["15"] = "mana-15";
mana["16"] = "mana-16";
mana["17"] = "mana-17";
mana["18"] = "mana-18";
mana["19"] = "mana-19";
mana["20"] = "mana-20";

export type CardTileQuantityTypes = "ODDS" | "NUMBER" | "RANK" | "TEXT";

interface CardTileQuantityBase {
  type: CardTileQuantityTypes;
}

interface QuantityOdds extends CardTileQuantityBase {
  type: "ODDS";
  quantity: number;
  odds: string;
}

interface QuantityNumber extends CardTileQuantityBase {
  type: "NUMBER";
  quantity: number;
}

interface QuantityRank extends CardTileQuantityBase {
  type: "RANK";
  quantity: string;
}

interface QuantityText extends CardTileQuantityBase {
  type: "TEXT";
  quantity: string;
}

export type CardTileQuantity =
  | QuantityOdds
  | QuantityNumber
  | QuantityRank
  | QuantityText;

export interface CardTileProps {
  card: DbCardData | undefined;
  deck?: Deck;
  dfcCard?: DbCardData;
  indent: string;
  isHighlighted: boolean;
  isSideboard: boolean;
  quantity: CardTileQuantity;
  showWildcards: boolean;
}

function CostSymbols(props: {
  card: DbCardData;
  dfcCard?: DbCardData;
}): JSX.Element {
  const { card, dfcCard } = props;
  const costSymbols: JSX.Element[] = [];
  let prevc = true;
  const hasSplitCost = card.dfc === FACE_SPLIT_FULL;

  const dfcSeparator = "//";
  if (card.cost) {
    if (!cardHasType(card, "Land") && card.cost.length === 0) {
      costSymbols.push(
        <div
          style={{
            justifyContent: "flex-end",
          }}
          // eslint-disable-next-line react/no-array-index-key
          key={`${card.id}_0`}
          className={`mana-s16 ${mana["0"]}`}
        />
      );
    }
    card.cost.forEach((cost: string, index: number) => {
      if (hasSplitCost) {
        if (/^(x|\d)+$/.test(cost) && prevc === false) {
          costSymbols.push(
            <span key={`${card.id}_cost_separator`}>{dfcSeparator}</span>
          );
        }
        prevc = /^\d+$/.test(cost);
      }
      costSymbols.push(
        <div
          style={{
            justifyContent: "flex-end",
          }}
          // eslint-disable-next-line react/no-array-index-key
          key={`${card.id}_${index}`}
          className={`mana-s16 ${mana[cost]}`}
        />
      );
    });
  }
  if (card.dfc === FACE_ADVENTURE_MAIN && dfcCard && dfcCard.cost) {
    // eslint-disable-next-line react/jsx-curly-brace-presence
    costSymbols.push(<span key={`${dfcCard.id}_cost_separator`}>{`//`}</span>);
    dfcCard.cost.forEach((cost: string, index: number) => {
      costSymbols.push(
        <div
          style={{
            justifyContent: "flex-end",
          }}
          // eslint-disable-next-line react/no-array-index-key
          key={`${dfcCard.id}_${index}`}
          className={`mana-s16 ${mana[cost]}`}
        />
      );
    });
  }
  return <>{costSymbols}</>;
}

function CardQuantityDisplay(props: {
  quantity: CardTileQuantity;
}): JSX.Element {
  const { quantity } = props;
  if (quantity.type == "ODDS") {
    // Mixed quantity (odds and quantity)
    return (
      <div className="card-tile-odds-flat">
        <div className="card-tile-odds-flat-half">{quantity.quantity}</div>
        <div className="card-tile-odds-flat-half-dark">{quantity.odds}</div>
      </div>
    );
  }
  if (quantity.type == "RANK") {
    // Text quantity, presumably rank
    const rankClass = getRankColorClass(quantity.quantity);
    return (
      <div className={`card-tile-odds-flat ${rankClass}`}>
        {quantity.quantity}
      </div>
    );
  }
  if (quantity.type == "NUMBER") {
    // Undefined Quantity
    return <div className="card-tile-quantity-flat">{quantity.quantity}</div>;
  }
  // if (quantity.type == "TEXT") {
  return <div className="card-tile-odds-flat">{quantity.quantity}</div>;
}

interface WildcardsNeededProps {
  card: DbCardData;
  deck: Deck;
  isSideboard: boolean;
  listStyle: "flat" | "arena";
  ww?: number;
}

interface MissingCardsProps {
  missing: number;
  cardRarity: Rarity;
  listStyle: "flat" | "arena";
  ww?: number;
}

function MissingCardSprite(props: MissingCardsProps): JSX.Element {
  const { missing, cardRarity, listStyle, ww } = props;

  const xoff =
    CARD_RARITIES.filter((r) => r !== "token" && r !== "land").indexOf(
      cardRarity
    ) * -24;
  const yoff = missing * -24;

  let className = "not-owned-sprite";
  if (listStyle === "flat") {
    className = "not-owned-sprite-flat";
  }

  const style: React.CSSProperties = {
    backgroundPosition: `${xoff}px ${yoff}px`,
  };
  if (ww) {
    style.left = `calc(0px - 100% + ${ww - 14}px)`;
  }

  return (
    <div className={className} title={`${missing} missing`} style={style} />
  );
}

function WildcardsNeeded(props: WildcardsNeededProps): JSX.Element {
  const { card, deck, isSideboard, listStyle, ww } = props;
  if (
    card.type.indexOf("Basic Land") === -1 &&
    card.type.indexOf("Basic Snow Land") === -1
  ) {
    const missing = getWildcardsMissing(deck, card.id, isSideboard);
    const cardRarity = card.rarity;

    if (missing > 0) {
      return MissingCardSprite({ missing, cardRarity, listStyle, ww });
    }
  }
  return <div className="not-owned-sprite-empty" />;
}

export default function CardTile(props: CardTileProps): JSX.Element {
  const {
    card,
    deck,
    dfcCard,
    indent,
    isHighlighted,
    isSideboard,
    quantity,
    showWildcards,
  } = props;
  const [isMouseHovering, setMouseHovering] = useState(false);
  const [hoverIn, hoverOut] = useHoverCard(card?.id || 0);
  const [cardUrl, setCardUrl] = useState<string | undefined>();

  const handleMouseEnter = useCallback((): void => {
    setMouseHovering(true);
    hoverIn();
  }, [hoverIn]);
  const handleMouseLeave = useCallback((): void => {
    setMouseHovering(false);
    hoverOut();
  }, [hoverOut]);

  const handleMouseClick = useCallback((): void => {
    let _card = card;
    if (card?.dfc === FACE_SPLIT_FULL) {
      _card = dfcCard || card;
    }
    openScryfallCard(_card);
  }, [card, dfcCard]);

  const cardTileStyle = { backgroundImage: "", borderImage: "" };
  cardTileStyle.backgroundImage = `url(${cardUrl || DEFAULT_TILE})`;

  let colorA = "c";
  let colorB = "c";
  if (card?.frame) {
    if (card.frame.length == 1) {
      colorA = COLORS_ALL[card.frame[0] - 1];
      colorB = COLORS_ALL[card.frame[0] - 1];
    } else if (card.frame.length == 2) {
      colorA = COLORS_ALL[card.frame[0] - 1];
      colorB = COLORS_ALL[card.frame[1] - 1];
    } else if (card.frame.length > 2) {
      colorA = "m";
      colorB = "m";
    }
  }
  cardTileStyle.borderImage = `linear-gradient(to bottom, var(--color-${colorA}) 30%, var(--color-${colorB}) 70%) 1 100%`;

  const tileStyle: CSSProperties = {
    backgroundColor: "var(--color-card-tile)",
  };
  if (isHighlighted) {
    tileStyle.backgroundColor = "var(--color-card-tile-active)";
  } else if (isMouseHovering) {
    tileStyle.backgroundColor = "var(--color-card-tile-hover)";
  }

  const phyrexianName = `|Ceghm.`; // Swamp
  const isPhyrexian = card?.id == 72578;

  useEffect(() => {
    const img = new Image();
    let imageUrl = getCardArtCrop(card || 0);
    if (card?.type == "Special") {
      imageUrl = card.images.art_crop;
    }
    img.src = imageUrl;
    img.onload = (): void => {
      setCardUrl(imageUrl);
    };
  }, [deck]);

  return (
    <div className="card-tile-container-outer">
      <div
        className="card-tile-container-flat click-on"
        data-grp-id={card?.id || 0}
        data-id={indent}
        data-quantity={quantity}
        style={tileStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseClick}
      >
        <CardQuantityDisplay quantity={quantity} />
        <div className="card-tile-crop-flat" style={cardTileStyle} />
        <div
          className="card-tile-name-flat"
          style={isPhyrexian ? { fontFamily: "PhyrexianHorizontal" } : {}}
        >
          {isPhyrexian ? phyrexianName : card?.name || "Unknown Card"}
        </div>
        <div className="cart-tile-mana-flat">
          {card ? <CostSymbols card={card} dfcCard={dfcCard} /> : <></>}
        </div>
      </div>
      {showWildcards && deck && card && (
        <WildcardsNeeded
          card={card}
          deck={deck}
          isSideboard={isSideboard}
          listStyle="flat"
        />
      )}
    </div>
  );
}

interface LandsTileProps {
  quantity: CardTileQuantity;
  isHighlighted?: boolean;
  frame: number[];
}

export function LandsTile(props: LandsTileProps): JSX.Element {
  const { quantity, frame, isHighlighted } = props;
  const [isMouseHovering, setMouseHovering] = useState(false);
  const [hoverIn, hoverOut] = useHoverCard(LANDS_HACK);

  const handleMouseEnter = useCallback((): void => {
    setMouseHovering(true);
    hoverIn();
  }, [hoverIn]);
  const handleMouseLeave = useCallback((): void => {
    setMouseHovering(false);
    hoverOut();
  }, [hoverOut]);

  const cardTileStyle = {
    backgroundImage: `url(${typeLand})`,
    borderImage: "",
  };

  let colorA = "c";
  let colorB = "c";

  if (frame.length == 1) {
    colorA = COLORS_ALL[frame[0] - 1];
    colorB = COLORS_ALL[frame[0] - 1];
  } else if (frame.length == 2) {
    colorA = COLORS_ALL[frame[0] - 1];
    colorB = COLORS_ALL[frame[1] - 1];
  } else if (frame.length > 2) {
    colorA = "m";
    colorB = "m";
  }

  cardTileStyle.borderImage = `linear-gradient(to bottom, var(--color-${colorA}) 30%, var(--color-${colorB}) 70%) 1 100%`;

  const tileStyle = { backgroundColor: "var(--color-card-tile)" };
  if (isHighlighted) {
    tileStyle.backgroundColor = "var(--color-card-tile-active)";
  } else if (isMouseHovering) {
    tileStyle.backgroundColor = "var(--color-card-tile-hover)";
  }

  return (
    <div className="card-tile-container-outer">
      <div
        className="card-tile-container-flat click-on"
        data-quantity={quantity}
        style={tileStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardQuantityDisplay quantity={quantity} />
        <div className="card-tile-crop-flat" style={cardTileStyle} />
        <div className="card-tile-name-flat">Lands</div>
      </div>
    </div>
  );
}
