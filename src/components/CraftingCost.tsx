import { useSelector } from "react-redux";

import { WILDCARD_RARITIES } from "../constants";
import { AppState } from "../redux/stores/rendererStore";
import getBoosterCountEstimate from "../utils/getBoosterCountEstimate";
import getDeckMissing from "../utils/getDeckMissing";
import Deck from "../utils/mtga/deck";

const wcIcon: Record<string, string> = {
  common: "wc-common",
  uncommon: "wc-uncommon",
  rare: "wc-rare",
  mythic: "wc-mythic",
};

const wcName: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
};

type IndexableObject = { [key: string]: number };

interface CraftingCostProps {
  deck: Deck;
}

/**
 * What it would cost in wildcards to own this deck, and what you already have.
 *
 * Iterates WILDCARD_RARITIES rather than CARD_RARITIES. The latter also holds
 * "token" and "land", which have no wildcard: only "land" was filtered out, so
 * the token row read its count off a map that has no such key and rendered
 * literally as "undefined (0)".
 */
export default function CraftingCost(props: CraftingCostProps): JSX.Element {
  const { deck } = props;
  const mainData = useSelector((state: AppState) => state.mainData);

  const uuid = mainData.currentUUID;
  if (!mainData?.uuidData || !mainData.uuidData[uuid]) return <></>;

  const owned: IndexableObject = {
    common: mainData.uuidData[uuid].inventory.WildCardCommons,
    uncommon: mainData.uuidData[uuid].inventory.WildCardUnCommons,
    rare: mainData.uuidData[uuid].inventory.WildCardRares,
    mythic: mainData.uuidData[uuid].inventory.WildCardMythics,
  };

  const missing: any = getDeckMissing(deck);
  const totalMissing = WILDCARD_RARITIES.reduce(
    (acc, rarity) => acc + (missing[rarity] || 0),
    0
  );
  const boosters = Math.round(getBoosterCountEstimate(missing));

  return (
    <div className="wildcards-cost-block">
      {totalMissing === 0 ? (
        <div className="wildcards-complete">
          You have every card in this deck.
        </div>
      ) : null}

      <div className="wildcards-row">
        {WILDCARD_RARITIES.map((rarity) => {
          const need = missing[rarity] || 0;
          const have = owned[rarity] > 0 ? owned[rarity] : 0;
          return (
            <div
              className="wildcard-cost"
              key={rarity}
              title={`${need} ${wcName[rarity]} wildcard${
                need === 1 ? "" : "s"
              } needed — you have ${have}`}
            >
              <div className={`wildcard-cost-icon ${wcIcon[rarity]}`} />
              <div
                className={`wildcard-cost-need${need > have ? " short" : ""}`}
              >
                {need}
              </div>
              <div className="wildcard-cost-have">of {have}</div>
            </div>
          );
        })}
      </div>

      {totalMissing > 0 ? (
        <div className="wildcards-note">
          Wildcards needed to build it, against the number you own. Roughly{" "}
          <strong>{boosters}</strong> booster{boosters === 1 ? "" : "s"} to open
          that many.
        </div>
      ) : null}
    </div>
  );
}
