import { uniq } from "lodash";
import { DbCardDataV2, constants } from "mtgatool-shared";

const { WHITE, BLUE, BLACK, RED, GREEN, COLORLESS } = constants;

export default function getCardColors(card: DbCardDataV2): number[] {
  const colors = card.ManaCost.reduce<number[]>((colorIndices, current) => {
    switch (current) {
      case "w":
        return colorIndices.concat(WHITE);
      case "u":
        return colorIndices.concat(BLUE);
      case "b":
        return colorIndices.concat(BLACK);
      case "r":
        return colorIndices.concat(RED);
      case "g":
        return colorIndices.concat(GREEN);
      default:
        return colorIndices;
    }
  }, []);
  const sortedAndUniqueColors = uniq(colors.sort());
  return sortedAndUniqueColors.length ? sortedAndUniqueColors : [COLORLESS];
}
