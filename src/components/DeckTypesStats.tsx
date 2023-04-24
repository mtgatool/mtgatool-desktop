import { constants, Deck } from "mtgatool-shared";

import { typeIcons } from "../constants";
import getDeckTypesAmount from "../utils/getDeckTypesAmount";

const { CARD_TYPES, CARD_TYPE_CODES } = constants;

export default function DeckTypesStats(props: {
  className?: string;
  deck: Deck;
}): JSX.Element {
  const { className, deck } = props;
  const cardTypes = getDeckTypesAmount(deck);
  return (
    <div className={className || "types-container"}>
      {CARD_TYPE_CODES.filter((t) => t != "dun").map((cardTypeKey, index) => {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div className="type-icon-cont" key={`type-icon-cont-${index}`}>
            <div
              className={`${"type-icon"} ${typeIcons[cardTypeKey]}`}
              title={CARD_TYPES[index]}
            />
            <span>{cardTypes[cardTypeKey]}</span>
          </div>
        );
      })}
    </div>
  );
}
