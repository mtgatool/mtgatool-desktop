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

const manaClasses: string[] = [];
manaClasses[WHITE] = "mana-w";
manaClasses[BLUE] = "mana-u";
manaClasses[BLACK] = "mana-b";
manaClasses[RED] = "mana-r";
manaClasses[GREEN] = "mana-g";
manaClasses[COLORLESS] = "mana-c";

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
              const manaBits = new Colors().addFromArray([mana]).getBits();
              // eslint-disable-next-line no-bitwise
              const newColors = colors ^ manaBits;
              setFilter(newColors);
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
