import _ from "lodash";
import { constants, Deck } from "mtgatool-shared";
import { Fragment } from "react";
import getBoosterCountEstimate from "../utils/getBoosterCountEstimate";
import getDeckMissing from "../utils/getDeckMissing";

const { CARD_RARITIES } = constants;

const wcIcon: Record<string, string> = {};
wcIcon.common = "wc-common";
wcIcon.uncommon = "wc-uncommon";
wcIcon.rare = "wc-rare";
wcIcon.mythic = "wc-mythic";

const getRarityKey = (
  rarity: string
): "rare" | "common" | "uncommon" | "mythic" | undefined => {
  if (["rare", "common", "uncommon", "mythic"].includes(rarity))
    return rarity as any;
  return undefined;
};

export default function WildcardsCost(props: {
  deck: Deck;
  shrink?: boolean;
}): JSX.Element {
  const { shrink, deck } = props;

  const missingWildcards = getDeckMissing(deck);

  const totalMissing =
    missingWildcards.common +
    missingWildcards.uncommon +
    missingWildcards.rare +
    missingWildcards.mythic;
  const drawCost = totalMissing > 0;

  // const ownedWildcards: MissingWildcards = {
  //   common: window.economy.wcCommon,
  //   uncommon: window.economy.wcUncommon,
  //   rare: window.economy.wcRare,
  //   mythic: window.economy.wcMythic,
  // };

  return (
    <div
      style={
        shrink
          ? { display: "flex", fontSize: "14px" }
          : { display: "flex", flexDirection: "row", marginRight: "16px" }
      }
    >
      {CARD_RARITIES.filter(
        (rarity) => rarity !== "land" && rarity !== "token"
      ).map((cardRarity: string, index) => {
        const key = getRarityKey(cardRarity);
        if (key) {
          // const owned = ownedWildcards[key];
          const missing = missingWildcards[key];
          if (missing) {
            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${deck.id}-${index}-${cardRarity}`}
                className={`${
                  shrink ? "wc-deckstab-cost" : "wc-explore-cost"
                } ${wcIcon[cardRarity]}`}
                title={`${_.capitalize(cardRarity)} wildcards needed.`}
              >
                {missing}
              </div>
            );
          }
        }
        // eslint-disable-next-line react/no-array-index-key
        return <Fragment key={`${deck.id}-${index}-${cardRarity}`} />;
      })}
      {drawCost && (
        <div
          title="Boosters needed (estimated)"
          className={shrink ? "bo-deckstab-cost" : "bo-explore-cost"}
        >
          {Math.round(getBoosterCountEstimate(missingWildcards))}
        </div>
      )}
    </div>
  );
}
