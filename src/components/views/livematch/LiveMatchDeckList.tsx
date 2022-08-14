/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */

import { constants, compareCards, CardObject, Deck } from "mtgatool-shared";

import { OVERLAY_SEEN } from "mtgatool-shared/dist/shared/constants";
import { OverlayUpdateMatchState } from "../../../background/store/types";

import DeckManaCurve from "../../DeckManaCurve";

import DeckList from "../../DeckList";
import Section from "../../ui/Section";
import LiveDeckTypesStats from "./LiveDeckTypesStats";
import LiveDeckLands from "./LiveDeckLands";

const { OVERLAY_FULL } = constants;

function _compareQuantity(a: CardObject, b: CardObject): -1 | 0 | 1 {
  if (b.quantity - a.quantity < 0) return -1;
  if (b.quantity - a.quantity > 0) return 1;
  return 0;
}

interface DeckListProps {
  matchState: OverlayUpdateMatchState;
  mode: number;
}

export default function LiveMatchDeckList(props: DeckListProps): JSX.Element {
  const { matchState, mode } = props;

  let deck = new Deck();
  if (mode === OVERLAY_SEEN) {
    const oppCards = new Deck(matchState.oppCards);
    oppCards.setName(`${matchState.opponent.name}'s deck`);
    deck = new Deck(matchState.oppCards);
  } else {
    // const oppCards = new Deck(matchState.oppCards);
    const playerCardsLeft = new Deck(matchState.playerCardsLeft);
    const playerDeck = new Deck(matchState.playerDeck);
    // const player.originalDeck = new Deck(matchState.player.originalDeck);

    playerCardsLeft.sortMainboard(compareCards);
    playerCardsLeft.sortSideboard(compareCards);
    playerCardsLeft.getMainboard().removeZeros();
    playerCardsLeft.getSideboard().removeZeros();
    // setOdds(matchState.playerCardsOdds);
    if (mode == OVERLAY_FULL) {
      deck = playerDeck;
    } else {
      deck = playerCardsLeft;
    }
  }
  const deckClone = deck.clone();

  const mainCards = deckClone.getMainboard();
  mainCards.removeDuplicates();

  const _deckCount = deck.getMainboard().count();

  return (
    <div className="live-decklist">
      <Section
        style={{
          gridArea: "deck",
          padding: "16px",
          flexDirection: "column",
        }}
      >
        <DeckList deck={deck} showWildcards={false} showOdds />
      </Section>
      <Section
        style={{
          gridArea: "types",
        }}
      >
        <LiveDeckTypesStats deck={deck} cardOdds={matchState.cardsOdds} />
      </Section>
      <Section
        style={{
          gridArea: "lands",
        }}
      >
        <LiveDeckLands cardOdds={matchState.cardsOdds} />
      </Section>
      <Section
        style={{
          gridArea: "curve",
        }}
      >
        <DeckManaCurve className="overlay-deck-mana-curve" deck={deck} />
      </Section>
    </div>
  );
}
