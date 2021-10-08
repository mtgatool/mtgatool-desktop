/* eslint-disable no-nested-ternary */
import { Colors, Deck, formatPercent } from "mtgatool-shared";
import { useEffect, useState } from "react";

import ManaCost from "./ManaCost";

import WildcardsCost from "./WildcardsCost";
import DeckColorsBar from "./DeckColorsBar";
import getDeckMissing from "../utils/getDeckMissing";
import { getCardArtCrop } from "../utils/getCardArtCrop";
import getWinrateClass from "../utils/getWinrateClass";
import { StatsDeck } from "../types/dbTypes";
import timeAgo from "../utils/timeAgo";
import getPreconDeckName from "../utils/getPreconDeckName";

import squirrels from "../assets/images/squirrels.png";
import { normalApproximationInterval } from "../utils/statsFns";

export interface DecksArtViewRowProps {
  clickDeck: (deck: StatsDeck) => void;
  deck: StatsDeck;
}

function isCached(src: string) {
  const image = new Image();
  image.src = src;
  return image.width + image.height > 0 || image.complete;
}

export default function DecksArtViewRow(
  props: DecksArtViewRowProps
): JSX.Element {
  const { clickDeck, deck } = props;
  const imageUrl = getCardArtCrop(deck.deckTileId);
  const [cardUrl, setCardUrl] = useState<string | undefined>(
    isCached(imageUrl) ? imageUrl : undefined
  );

  const deckObj = new Deck(deck);

  const deckColors = new Colors().addFromBits(deck.colors || 0);

  const totalMatches = deck.stats.matchLosses + deck.stats.matchWins;
  let totalWinrate = totalMatches > 0 ? deck.stats.matchWins / totalMatches : 0;

  // Deck winrates
  let winrateInterval = "???";
  let winrateTooltip = "play at least 20 matches to estimate actual winrate";
  // let winrateEditTooltip = "no data yet";
  if (totalMatches >= 20) {
    const { winrate, interval } = normalApproximationInterval(
      totalMatches,
      deck.stats.matchWins
    );
    const roundWinrate = (x: number): number => Math.round(x * 100) / 100;
    totalWinrate = roundWinrate(winrate);
    winrateInterval = `${formatPercent(interval)}`;
    const winrateLow = roundWinrate(winrate - interval);
    const winrateHigh = roundWinrate(winrate + interval);

    winrateTooltip = `${formatPercent(winrateLow)} to ${formatPercent(
      winrateHigh
    )} with 95% confidence (estimated actual winrate bounds, assuming a normal distribution)`;
  }

  const lastTouch = new Date(deck.lastUsed).getTime();
  const missingWildcards = getDeckMissing(deckObj);
  const totalMissing =
    missingWildcards.common +
    missingWildcards.uncommon +
    missingWildcards.rare +
    missingWildcards.mythic;

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = (): void => {
      setTimeout(() => setCardUrl(imageUrl), 250);
    };
  }, [deck]);

  return (
    <div
      className="decks-table-deck-tile"
      onClick={() => clickDeck(deck)}
      style={{
        backgroundImage: `url(${cardUrl || squirrels})`,
      }}
    >
      <DeckColorsBar deck={deckObj} />
      <div className="decks-table-deck-inner">
        <div className="decks-table-deck-item">
          {getPreconDeckName(deck.name)}
        </div>
        <div className="decks-table-deck-item">
          <ManaCost colors={deckColors.get()} />
        </div>
        <div className="decks-table-deck-item" title={winrateTooltip}>
          {totalMatches > 0 ? (
            <>
              {deck.stats.matchWins}:{deck.stats.matchLosses} (
              <span className={getWinrateClass(totalWinrate, true)}>
                {formatPercent(totalWinrate)}
              </span>{" "}
              <i style={{ opacity: 0.6 }}> &plusmn; {winrateInterval}</i>)
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
