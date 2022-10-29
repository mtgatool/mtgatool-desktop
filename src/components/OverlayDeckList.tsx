/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { useCallback, useRef, useState } from "react";
import {
  constants,
  Colors,
  compareCards,
  Deck,
  Chances,
  CardObject,
  database,
} from "mtgatool-shared";

import QRCode from "qrcode";

import { OverlaySettings } from "../common/defaultConfig";

import CardTile, { LandsTile, CardTileQuantity } from "./CardTile";

import DeckManaCurve from "./DeckManaCurve";
import DeckTypesStats from "./DeckTypesStats";
import SampleSizePanel from "./SampleSizePanel";

import { ReactComponent as QrCodeIcon } from "../assets/images/svg/qrcode.svg";
import copyToClipboard from "../utils/copyToClipboard";

const { OVERLAY_FULL, OVERLAY_LEFT, OVERLAY_MIXED, OVERLAY_ODDS, LANDS_HACK } =
  constants;

function _compareQuantity(a: CardObject, b: CardObject): -1 | 0 | 1 {
  if (b.quantity - a.quantity < 0) return -1;
  if (b.quantity - a.quantity > 0) return 1;
  return 0;
}

interface DeckListProps {
  matchId: string;
  deck: Deck;
  subTitle: string;
  highlightCardId?: number;
  settings: OverlaySettings;
  cardOdds?: Chances;
  setOddsCallback?: (sampleSize: number) => void;
}

export default function OverlayDeckList(props: DeckListProps): JSX.Element {
  const {
    matchId,
    deck,
    subTitle,
    settings,
    highlightCardId,
    cardOdds,
    setOddsCallback,
  } = props;

  const QRCanvas = useRef<HTMLCanvasElement | null>(null);

  const [showQrCode, setShowQrCode] = useState(false);

  const generateQrCode = useCallback(
    (url: string) => {
      copyToClipboard(url);
      QRCode.toCanvas(QRCanvas.current, url, { margin: 2 }, () => {
        setShowQrCode(true);
      });
    },
    [QRCanvas]
  );

  if (!deck) return <></>;
  const deckClone = deck.clone();

  let sortFunc = compareCards;

  if (settings.mode === OVERLAY_ODDS || settings.mode == OVERLAY_MIXED) {
    sortFunc = compareCards; // compareQuantity;
  }
  const mainCardTiles: JSX.Element[] = [];
  const mainCards = deckClone.getMainboard();
  mainCards.removeDuplicates();

  const shouldDoGroupLandsHack =
    settings.lands &&
    [OVERLAY_FULL, OVERLAY_LEFT, OVERLAY_ODDS, OVERLAY_MIXED].includes(
      settings.mode
    );

  let landsNumber = 0;
  const landsColors = new Colors();
  mainCards.get().forEach((card: CardObject) => {
    const cardObj = database.card(card.id);
    if (cardObj && cardObj.Types.includes("Land", 0)) {
      landsNumber += card.quantity;
      if (cardObj.FrameColors) {
        landsColors.addFromArray(cardObj.FrameColors);
      }
    }
  });
  const landsFrame = landsColors.get();

  // Default to lands number
  let landsQuantity: CardTileQuantity = {
    type: "NUMBER",
    quantity: landsNumber,
  };

  if (settings.mode === OVERLAY_MIXED) {
    landsQuantity = {
      type: "ODDS",
      quantity: landsNumber,
      odds: ((cardOdds?.chanceLan || 0) / 100).toLocaleString([], {
        style: "percent",
        maximumSignificantDigits: 2,
      }),
    };
  } else if (settings.mode === OVERLAY_ODDS) {
    landsQuantity = {
      type: "TEXT",
      quantity: ((cardOdds?.chanceLan || 0) / 100).toLocaleString([], {
        style: "percent",
        maximumSignificantDigits: 2,
      }),
    };
  }

  if (shouldDoGroupLandsHack) {
    mainCards.add(LANDS_HACK, 1, true);
  }
  mainCards.get().sort(sortFunc);
  mainCards.get().forEach((card: CardObject, index: number) => {
    if (card.id === LANDS_HACK) {
      mainCardTiles.push(
        <LandsTile
          // eslint-disable-next-line react/no-array-index-key
          key={`maincardtile_${index}_lands`}
          quantity={landsQuantity}
          frame={landsFrame}
        />
      );
    } else {
      // default number
      let quantity: CardTileQuantity = {
        type: "NUMBER",
        quantity: card.quantity,
      };
      const fullCard = database.card(card.id);

      if (fullCard) {
        if (settings.mode === OVERLAY_MIXED) {
          const odds = `${card.chance || 0}%`;
          const q = card.quantity;
          if (!settings.lands || (settings.lands && odds !== "0%")) {
            quantity = {
              type: "ODDS",
              quantity: q,
              odds: odds,
            };
          }
        } else if (settings.mode === OVERLAY_ODDS) {
          quantity = {
            type: "TEXT",
            quantity: ((card.chance || 0) / 100).toLocaleString([], {
              style: "percent",
              maximumSignificantDigits: 2,
            }),
          };
        }

        if (
          shouldDoGroupLandsHack &&
          fullCard.Types &&
          fullCard.Types.includes("Land", 0)
        ) {
          // skip land cards while doing group lands hack
          return;
        }

        const dfcCard = card?.dfcId
          ? database.card(parseInt(card.dfcId))
          : undefined;
        mainCardTiles.push(
          <CardTile
            card={fullCard}
            dfcCard={dfcCard}
            key={`maincardtile_${card.id}`}
            indent="a"
            isSideboard={false}
            quantity={quantity}
            showWildcards={false}
            deck={deck}
            isHighlighted={card.id === highlightCardId}
          />
        );
      }
    }
  });

  const sideboardCardTiles: JSX.Element[] = [];
  const sideboardCards = deckClone.getSideboard().count();
  if (settings.sideboard && sideboardCards > 0) {
    const sideCards = deckClone.getSideboard();
    sideCards.removeDuplicates();
    sideCards.get().sort(sortFunc);
    sideCards.get().forEach((card: any, index: number) => {
      const quantity =
        settings.mode === OVERLAY_ODDS || settings.mode === OVERLAY_MIXED
          ? settings.mode === OVERLAY_ODDS
            ? "0%"
            : {
                quantity: card.quantity,
                odds: "0%",
              }
          : card.quantity;
      let fullCard = card;
      if (card?.id) {
        fullCard = database.card(card.id);
      }
      let dfcCard;
      if (card?.dfcId) {
        dfcCard = database.card(card.dfcId);
      }
      sideboardCardTiles.push(
        <CardTile
          card={fullCard}
          dfcCard={dfcCard}
          key={`sideboardcardtile_${index}_${card.id}`}
          indent="a"
          isSideboard
          quantity={quantity}
          showWildcards={false}
          deck={deck}
          isHighlighted={false}
        />
      );
    });
  }

  return (
    <div className="overlay-decklist click-on">
      {!!settings.title && (
        <div className="decklist-title">
          <div className="title-text">{subTitle}</div>
          <QrCodeIcon
            onClick={() => {
              if (showQrCode) setShowQrCode(false);
              else generateQrCode(`https://app.mtgatool.com/match/${matchId}`);
            }}
            className="title-qrcode"
          />
        </div>
      )}
      <canvas
        ref={QRCanvas}
        className="overlay-qrcode"
        style={{ display: `${showQrCode ? "block" : "none"}` }}
      />
      {!!settings.deck && mainCardTiles}
      {!!settings.sideboard && sideboardCardTiles.length > 0 && (
        <div className="decklist-title">Sideboard ({sideboardCards} cards)</div>
      )}
      {!!settings.sideboard &&
        sideboardCardTiles.length > 0 &&
        sideboardCardTiles}
      {!!settings.typeCounts && (
        <DeckTypesStats className="overlay-deck-type-stats" deck={deck} />
      )}
      {!!settings.manaCurve && (
        <DeckManaCurve className="overlay-deck-mana-curve" deck={deck} />
      )}
      {!!settings.drawOdds &&
      (settings.mode === OVERLAY_ODDS || settings.mode === OVERLAY_MIXED) &&
      cardOdds &&
      setOddsCallback ? (
        <SampleSizePanel
          cardOdds={cardOdds}
          cardsLeft={deck.getMainboard().count()}
          setOddsCallback={setOddsCallback}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
