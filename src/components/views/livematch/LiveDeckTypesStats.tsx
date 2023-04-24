import { Chances, constants, Deck } from "mtgatool-shared";

import { typeIcons } from "../../../constants";
import getDeckTypesAmount from "../../../utils/getDeckTypesAmount";

const { CARD_TYPES, CARD_TYPE_CODES } = constants;

export default function LiveDeckTypesStats(props: {
  className?: string;
  cardOdds: Chances;
  deck: Deck;
}): JSX.Element {
  const { className, cardOdds, deck } = props;
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
            <span>{cardTypes[cardTypeKey]} left</span>
            <span>
              {cardTypeKey === "art" ? cardOdds.chanceArt : ""}
              {cardTypeKey === "cre" ? cardOdds.chanceCre : ""}
              {cardTypeKey === "enc" ? cardOdds.chanceEnc : ""}
              {cardTypeKey === "bat" ? cardOdds.chanceBat : ""}
              {cardTypeKey === "ins" ? cardOdds.chanceIns : ""}
              {cardTypeKey === "lan" ? cardOdds.chanceLan : ""}
              {cardTypeKey === "pla" ? cardOdds.chancePla : ""}
              {cardTypeKey === "sor" ? cardOdds.chanceSor : ""}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
