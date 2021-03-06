/* eslint-disable react/no-array-index-key */
import { constants } from "mtgatool-shared";
import { Fragment } from "react";

const { WHITE, BLUE, BLACK, RED, GREEN, COLORLESS } = constants;

const manaClasses: string[] = [];
manaClasses[WHITE] = "mana-w";
manaClasses[BLUE] = "mana-u";
manaClasses[BLACK] = "mana-b";
manaClasses[RED] = "mana-r";
manaClasses[GREEN] = "mana-g";
manaClasses[COLORLESS] = "mana-c";

export interface ManaCostProps {
  colors: number[];
  className?: string;
}

export default function ManaCost(props: ManaCostProps): JSX.Element {
  const { colors, className } = props;
  // Default to size 16px, Initially these had classes because "s" was for
  // shadowed mana costs, whereas no prefix was regular, non shadowed icon.
  // I supose these could be a set of props instead.
  const newclass = className || "mana-s16";

  return (
    <>
      {colors.map((mana, index) => {
        if (colors.length > 1 && mana === COLORLESS) {
          return <Fragment key={`${mana}-${index}-${colors.join("-")}`} />;
        }
        return (
          <div
            key={`${mana}-${index}-${colors.join("-")}`}
            className={`${newclass} flex-end ${manaClasses[mana]}`}
          />
        );
      })}
    </>
  );
}
