/* eslint-disable no-bitwise */
import { useState } from "react";
import {
  BLACK,
  BLUE,
  COLORLESS,
  GREEN,
  RED,
  WHITE,
} from "mtgatool-shared/dist/shared/constants";
import { Colors } from "mtgatool-shared";
import manaClasses from "../common/manaClasses";

interface ManaFilterProps {
  initialState: number;
  callback: (filter: number) => void;
}

export default function ManaFilter(props: ManaFilterProps): JSX.Element {
  const { initialState, callback } = props;
  const [colors, setColors] = useState(initialState);

  const setFilter = (newColors: number): void => {
    setColors(newColors);
    callback(newColors);
  };

  const filteredColors = new Colors();
  filteredColors.addFromBits(colors);

  const manas = filteredColors.get();

  return (
    <div className="mana-filters">
      {[WHITE, BLUE, BLACK, RED, GREEN, COLORLESS].map((mana) => {
        return (
          <div
            key={`mana-filter-${mana}`}
            onClick={(): void => {
              const currentBits = filteredColors.getBits();
              const manaBits = new Colors().addFromArray([mana]).getBits();
              if (mana === COLORLESS && currentBits < 32) {
                setFilter(32);
              } else {
                // Remove colorless when selecting a color
                const newColors = colors ^ manaBits;
                setFilter(newColors > 31 ? newColors - 32 : newColors);
              }
            }}
            className={`mana-filter ${manaClasses[mana]} ${
              manas.includes(mana) ? "filter-on" : ""
            }`}
          />
        );
      })}
    </div>
  );
}
