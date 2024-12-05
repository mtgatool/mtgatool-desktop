import _ from "lodash";

import { CARD_TYPE } from "../constants";
import { DbCardDataV2 } from "../types";

export function cardHasType(card: DbCardDataV2, type: string): boolean {
  if (
    !_.has(card, "Types") ||
    !_.has(card, "Subtypes") ||
    !_.has(card, "Supertypes")
  )
    throw new Error("The specified card object does not have a type property");
  return (
    card.Types.toLowerCase().includes(type.toLowerCase()) ||
    card.Subtypes.toLowerCase().includes(type.toLowerCase()) ||
    card.Supertypes.toLowerCase().includes(type.toLowerCase())
  );
}

export const cardType = (card: DbCardDataV2): string => {
  const result = CARD_TYPE.find((ct) => cardHasType(card, ct));
  if (!result) throw new Error("Card type could not be determined");
  return result;
};
