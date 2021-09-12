import { constants, Deck } from "mtgatool-shared";
import { useSelector } from "react-redux";
import { AppState } from "../redux/stores/rendererStore";
import getBoosterCountEstimate from "../utils/getBoosterCountEstimate";
import getDeckMissing from "../utils/getDeckMissing";

const { CARD_RARITIES } = constants;

const wcIcon: Record<string, string> = {};
wcIcon.common = "wc-common";
wcIcon.uncommon = "wc-uncommon";
wcIcon.rare = "wc-rare";
wcIcon.mythic = "wc-mythic";

type IndexableObject = { [key: string]: number };

interface CraftingCostProps {
  deck: Deck;
}

export default function CraftingCost(props: CraftingCostProps): JSX.Element {
  const { deck } = props;
  const { mainData } = useSelector((state: AppState) => state);

  if (!mainData?.uuidData) return <></>;

  const uuid = mainData.currentUUID;

  const ownedWildcards: IndexableObject = {
    common: mainData.uuidData[uuid].inventory.WildCardCommons,
    uncommon: mainData.uuidData[uuid].inventory.WildCardUnCommons,
    rare: mainData.uuidData[uuid].inventory.WildCardRares,
    mythic: mainData.uuidData[uuid].inventory.WildCardMythics,
  };

  // Another deck.getSave() conversion here..
  const missingWildcards: any = getDeckMissing(deck);
  const boosterCost = getBoosterCountEstimate(missingWildcards);

  return (
    <div className="wildcards-cost">
      {CARD_RARITIES.filter(
        (rarity) => rarity !== "land" && rarity !== "token"
      ).map((cardRarity) => {
        const cardRarityLowercase = cardRarity.toLowerCase();
        const wcText = `${missingWildcards[cardRarityLowercase]} (${
          ownedWildcards[cardRarityLowercase] > 0
            ? ownedWildcards[cardRarityLowercase]
            : 0
        })`;
        return (
          <div
            key={cardRarity}
            title={cardRarity}
            className={`${"wc-cost"} ${wcIcon[cardRarity]}`}
          >
            {wcText}
          </div>
        );
      })}
      <div
        title="Approximate boosters"
        className={`${"wc-cost"} ${"wc-booster"}`}
      >
        {Math.round(boosterCost)}
      </div>
    </div>
  );
}
