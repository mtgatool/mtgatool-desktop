/* eslint-disable no-nested-ternary */
import _ from "lodash";
import { constants, MissingWildcards } from "mtgatool-shared";
import { Fragment } from "react";
import getBoosterCountEstimate from "../utils/getBoosterCountEstimate";

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

interface WildcardsCostPresetProps {
  wildcards: {
    c?: number;
    u?: number;
    r?: number;
    m?: number;
  };
  showComplete?: boolean;
}

export default function WildcardsCostPreset(
  props: WildcardsCostPresetProps
): JSX.Element {
  const { wildcards, showComplete } = props;
  const { c, u, r, m } = wildcards;

  const missingWildcards: MissingWildcards = {
    common: c || 0,
    uncommon: u || 0,
    rare: r || 0,
    mythic: m || 0,
  };

  const totalMissing =
    missingWildcards.common +
    missingWildcards.uncommon +
    missingWildcards.rare +
    missingWildcards.mythic;

  const drawCost = totalMissing > 0;

  const boostersNeeded = Math.round(getBoosterCountEstimate(missingWildcards));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {CARD_RARITIES.filter(
        (rarity) => rarity !== "land" && rarity !== "token"
      ).map((cardRarity: string) => {
        const key = getRarityKey(cardRarity);
        if (key) {
          const missing = missingWildcards[key];
          if (missing) {
            return (
              <div
                key={`${cardRarity}-${missing}`}
                className={`${"wc-explore-cost"} ${wcIcon[cardRarity]}`}
                title={_.capitalize(cardRarity)}
              >
                {missing}
              </div>
            );
          }
        }
        return <Fragment key={`${cardRarity}-${0}`} />;
      })}
      {showComplete && boostersNeeded == 0 ? (
        <div title="You can build this deck!" className="wc-complete" />
      ) : drawCost ? (
        <div
          title="Boosters needed (estimated)"
          className="bo-explore-cost-large"
        >
          {boostersNeeded}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
