/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import {
  constants,
  Colors,
  compareCards,
  Deck,
  Chances,
  CardObject,
  OverlaySettingsData,
  database,
} from "mtgatool-shared";

import getCardTypeSort from "../utils/getCardTypeSort";
import CardTile, { LandsTile, CardTileQuantity } from "./CardTile";

import DeckManaCurve from "./DeckManaCurve";
import DeckTypesStats from "./DeckTypesStats";
import OwnershipStars from "./OwnershipStars";
import SampleSizePanel from "./SampleSizePanel";

const {
  DRAFT_RANKS,
  DRAFT_RANKS_LOLA,
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LEFT,
  OVERLAY_MIXED,
  OVERLAY_ODDS,
  LANDS_HACK,
} = constants;

function getRank(cardId: number): number {
  const cardObj = database.card(cardId);
  return cardObj?.rank || 0;
}

function compareQuantity(a: CardObject, b: CardObject): -1 | 0 | 1 {
  if (b.quantity - a.quantity < 0) return -1;
  if (b.quantity - a.quantity > 0) return 1;
  return 0;
}

function compareDraftPicks(a: CardObject, b: CardObject): -1 | 0 | 1 {
  const aCard = database.card(a.id);
  const bCard = database.card(b.id);
  if (bCard === undefined) {
    return -1;
  }
  if (aCard === undefined) {
    return 1;
  }
  const aColors = new Colors();
  if (aCard.cost) {
    aColors.addFromCost(aCard.cost);
  }
  const bColors = new Colors();
  if (bCard.cost) {
    bColors.addFromCost(bCard.cost);
  }
  const aType = getCardTypeSort(aCard.type);
  const bType = getCardTypeSort(bCard.type);

  const rankDiff =
    aCard.source == 0 ? bCard.rank - aCard.rank : aCard.rank - bCard.rank;
  const colorsLengthDiff = aColors.length - bColors.length;
  const cmcDiff = aCard.cmc - bCard.cmc;
  const typeDiff = aType - bType;
  const localeCompare = aCard.name.localeCompare(bCard.name);
  const compare =
    rankDiff || colorsLengthDiff || cmcDiff || typeDiff || localeCompare;

  if (compare < 0) {
    return -1;
  }
  if (compare > 0) {
    return 1;
  }
  return 0;
}

interface DeckListProps {
  deck: Deck;
  subTitle: string;
  highlightCardId?: number;
  settings: OverlaySettingsData;
  cardOdds?: Chances;
  setOddsCallback?: (sampleSize: number) => void;
}

export default function DeckList(props: DeckListProps): JSX.Element {
  const {
    deck,
    subTitle,
    settings,
    highlightCardId,
    cardOdds,
    setOddsCallback,
  } = props;
  if (!deck) return <></>;
  const deckClone = deck.clone();

  let sortFunc = compareCards;
  if (settings.mode === OVERLAY_ODDS || settings.mode == OVERLAY_MIXED) {
    sortFunc = compareQuantity;
  } else if (settings.mode === OVERLAY_DRAFT) {
    sortFunc = compareDraftPicks;
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
    if (cardObj && cardObj.type.includes("Land", 0)) {
      landsNumber += card.quantity;
      if (cardObj.frame) {
        landsColors.addFromArray(cardObj.frame);
      }
    }
  });
  const landsFrame = landsColors.get();

  let landsQuantity: CardTileQuantity = landsNumber;
  if (settings.mode === OVERLAY_MIXED) {
    landsQuantity = {
      quantity: landsNumber,
      odds: ((cardOdds?.chanceLan || 0) / 100).toLocaleString([], {
        style: "percent",
        maximumSignificantDigits: 2,
      }),
    };
  } else if (settings.mode === OVERLAY_ODDS) {
    landsQuantity = ((cardOdds?.chanceLan || 0) / 100).toLocaleString([], {
      style: "percent",
      maximumSignificantDigits: 2,
    });
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
      const qq = card.quantity;
      let quantity:
        | {
            quantity: number;
            odds: string;
          }
        | number
        | string = qq;
      const fullCard = database.card(card.id);

      if (fullCard) {
        if (settings.mode === OVERLAY_MIXED) {
          const odds = `${card.chance || 0}%`;
          const q = card.quantity;
          if (!settings.lands || (settings.lands && odds !== "0%")) {
            quantity = {
              quantity: q,
              odds: odds,
            };
          }
        } else if (settings.mode === OVERLAY_ODDS) {
          quantity = ((card.chance || 0) / 100).toLocaleString([], {
            style: "percent",
            maximumSignificantDigits: 2,
          });
        } else if (settings.mode === OVERLAY_DRAFT) {
          const rank = getRank(card.id);
          quantity =
            fullCard.source == 0 ? DRAFT_RANKS[rank] : DRAFT_RANKS_LOLA[rank];
        }

        if (settings.mode === OVERLAY_DRAFT) {
          mainCardTiles.push(
            <div
              className="overlay-card-quantity"
              key={`maincardtile_owned_${index}_${card.id}`}
            >
              <OwnershipStars card={fullCard} />
            </div>
          );
        } else if (
          shouldDoGroupLandsHack &&
          fullCard &&
          fullCard.type &&
          fullCard.type.includes("Land", 0)
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
      <div className="decklist-title">{subTitle}</div>
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
