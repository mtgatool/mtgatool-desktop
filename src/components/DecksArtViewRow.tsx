/* eslint-disable no-nested-ternary */
import { Colors, Deck, formatPercent, InternalDeck } from "mtgatool-shared";
import ManaCost from "./ManaCost";

import WildcardsCost from "./WildcardsCost";
import DeckColorsBar from "./DeckColorsBar";
import getDeckMissing from "../utils/getDeckMissing";
import { getCardArtCrop } from "../utils/getCardArtCrop";
import getWinrateClass from "../utils/getWinrateClass";
import { GunDeck } from "../types/gunTypes";
import timeAgo from "../utils/timeAgo";
import baseToObj from "../utils/baseToObj";

interface DecksArtViewRowProps {
  clickDeck: (deck: GunDeck) => void;
  deck: GunDeck;
}

export default function DecksArtViewRow(
  props: DecksArtViewRowProps
): JSX.Element {
  const { clickDeck, deck } = props;

  const internalDeck = baseToObj<InternalDeck>(deck.internalDeck);
  const deckObj = new Deck(internalDeck);

  const deckColors = new Colors().addFromBits(deck.colors);

  const totalMatches = deck.stats.matchLosses + deck.stats.matchWins;
  const winrate = totalMatches > 0 ? deck.stats.matchWins / totalMatches : 0;

  // Deck winrates
  let winrateInterval = "???";
  // let winrateTooltip = "play at least 20 matches to estimate actual winrate";
  // let winrateEditTooltip = "no data yet";
  if (totalMatches >= 20) {
    winrateInterval = formatPercent(winrate);
  }

  const lastTouch =
    deck.lastUsed || new Date(internalDeck.lastUpdated).getTime();
  const missingWildcards = getDeckMissing(deckObj);
  const totalMissing =
    missingWildcards.common +
    missingWildcards.uncommon +
    missingWildcards.rare +
    missingWildcards.mythic;

  return (
    <div
      className="decks-table-deck-tile"
      onClick={() => clickDeck(deck)}
      style={{
        backgroundImage: `url(${getCardArtCrop(deck.tile)})`,
      }}
    >
      <DeckColorsBar deck={deckObj} />
      <div className="decks-table-deck-inner">
        <div className="decks-table-deck-item">{deck.name}</div>
        <div className="decks-table-deck-item">
          <ManaCost colors={deckColors.get()} />
        </div>
        <div className="decks-table-deck-item">
          {totalMatches > 0 ? (
            <>
              {deck.stats.matchWins}:{deck.stats.matchLosses} (
              <span className={getWinrateClass(winrate, true)}>
                {formatPercent(winrate)}
              </span>{" "}
              <i style={{ opacity: 0.6 }}>&plusmn; {winrateInterval}</i>)
            </>
          ) : totalMissing > 0 ? (
            <WildcardsCost deck={deckObj} shrink />
          ) : (
            <span>---</span>
          )}
        </div>
        {totalMissing == 0 ? (
          <div className="decks-table-deck-item time">{timeAgo(lastTouch)}</div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
