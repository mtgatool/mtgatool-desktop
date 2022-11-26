/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { CardObject, compareCards, constants, Deck } from "mtgatool-shared";
import {
  OVERLAY_ODDS,
  OVERLAY_SEEN,
} from "mtgatool-shared/dist/shared/constants";
import { useState } from "react";

import { OverlayUpdateMatchState } from "../../../background/store/types";
import DeckList from "../../DeckList";
import DeckManaCurve from "../../DeckManaCurve";
import Flex from "../../Flex";
import Section from "../../ui/Section";
import Select from "../../ui/Select";
import LiveDeckLands from "./LiveDeckLands";
import LiveDeckTypesStats from "./LiveDeckTypesStats";

const { OVERLAY_FULL } = constants;

const modeOptions = ["Opponent deck", "Player deck"];

function _compareQuantity(a: CardObject, b: CardObject): -1 | 0 | 1 {
  if (b.quantity - a.quantity < 0) return -1;
  if (b.quantity - a.quantity > 0) return 1;
  return 0;
}

interface DeckListProps {
  matchState: OverlayUpdateMatchState;
}

export default function LiveMatchDeckList(props: DeckListProps): JSX.Element {
  const { matchState } = props;

  const [modeOption, setMode] = useState("Player deck");

  let mode = OVERLAY_ODDS;

  if (modeOption === "Opponent deck") {
    mode = OVERLAY_SEEN;
  }

  let deck = new Deck();
  const playerCardsLeft = new Deck(matchState.playerCardsLeft);
  if (mode === OVERLAY_SEEN) {
    const oppCards = new Deck(matchState.oppCards);
    oppCards.setName(`${matchState.opponent.name}'s deck`);
    deck = new Deck(matchState.oppCards);
  } else {
    // const oppCards = new Deck(matchState.oppCards);
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
        <Select
          style={{
            margin: "0 auto 8px",
          }}
          options={modeOptions}
          current={modeOption}
          callback={setMode}
        />
        <DeckList
          deck={deck}
          showWildcards={false}
          showOdds={modeOption === "Player deck"}
        />
      </Section>
      <Section
        style={{
          gridArea: "types",
          flexDirection: "column",
        }}
      >
        <div className="card-tile-separator">Types</div>
        <Flex>
          <LiveDeckTypesStats
            deck={playerCardsLeft}
            cardOdds={matchState.cardsOdds}
          />
        </Flex>
      </Section>
      <Section
        style={{
          gridArea: "lands",
          flexDirection: "column",
        }}
      >
        <div className="card-tile-separator">Land odds</div>
        <Flex>
          <LiveDeckLands cardOdds={matchState.cardsOdds} />
        </Flex>
      </Section>
      <Section
        style={{
          gridArea: "curve",
          flexDirection: "column",
        }}
      >
        <div className="card-tile-separator">Mana curve</div>
        <Flex>
          <DeckManaCurve className="overlay-deck-mana-curve" deck={deck} />
        </Flex>
      </Section>
    </div>
  );
}
