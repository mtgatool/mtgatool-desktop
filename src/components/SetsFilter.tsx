import { CSSProperties } from "react";
import { isEqual } from "lodash";
import { CardSet, database } from "mtgatool-shared";
import allFormats from "../common/allFormats";

interface SetsFilterProps {
  singleSelection?: boolean;
  style?: CSSProperties;
  callback: (sets: string[]) => void;
  filtered: string[];
}

type Set = CardSet & { name: string };

export default function SetsFilter(props: SetsFilterProps): JSX.Element {
  const { singleSelection, style, callback, filtered } = props;
  // const formats = useSelector((state: AppState) => state.renderer.formats);
  // All sets after Ixalan
  const filterable = Object.keys(database.sets).filter(
    (set) => database.sets[set].collation > 0
  );

  filterable.push(
    "Jumpstart",
    "Jumpstart: Historic Horizons",
    "Explorer Anthology 1",
    "Historic Anthology 1",
    "Historic Anthology 2",
    "Historic Anthology 3",
    "Historic Anthology 4",
    "Historic Anthology 5",
    "Historic Anthology 6"
  );

  const filterSets: Set[] = filterable.map((set) => {
    return { name: set, ...database.sets[set] };
  });

  const setFilteredSet = (setCode: string): void => {
    if (singleSelection === true) {
      if (isEqual([setCode], filtered)) {
        callback([]);
      } else {
        callback([setCode]);
      }
    } else {
      const index = filtered.indexOf(setCode);
      if (index !== -1) {
        callback(filtered.filter((s) => s !== setCode));
      } else {
        callback([...filtered, setCode]);
      }
    }
  };

  const otherSets: Set[] = [];
  const allSets: Set[] = filterSets.filter((s) => s?.code);
  const standardSets: Set[] = [];
  const alchemySets: Set[] = [];

  const standard = allFormats.Standard.sets;
  const alchemy = allFormats.Explorer.sets;
  allSets.forEach((s) => {
    if (standard.includes(s.arenacode) || standard.includes(s.code)) {
      standardSets.push(s);
    } else if (alchemy.includes(s.arenacode) || alchemy.includes(s.code)) {
      alchemySets.push(s);
    } else {
      otherSets.push(s);
    }
  });

  return (
    <div
      className="set-filter-container"
      style={{
        ...style,
      }}
    >
      <div className="set-division">
        {alchemySets.map((set) => {
          const svgData = set.svg;
          const setClass = `set-filter ${
            filtered.indexOf(set.code.toLowerCase()) == -1
              ? "set-filter-on"
              : ""
          }`;
          return (
            <div
              key={set.code.toLowerCase()}
              style={{
                backgroundImage: `url(data:image/svg+xml;base64,${svgData})`,
              }}
              title={set.name}
              className={setClass}
              onClick={(): void => setFilteredSet(set.code.toLowerCase())}
            />
          );
        })}
        {standardSets.map((set) => {
          const svgData = set.svg;
          const setClass = `set-filter ${
            filtered.indexOf(set.code.toLowerCase()) == -1
              ? "set-filter-on"
              : ""
          }`;
          return (
            <div
              key={set.code.toLowerCase()}
              style={{
                backgroundImage: `url(data:image/svg+xml;base64,${svgData})`,
              }}
              title={set.name}
              className={setClass}
              onClick={(): void => setFilteredSet(set.code.toLowerCase())}
            />
          );
        })}
      </div>
      <div className="set-division">
        {otherSets.map((set) => {
          const svgData = set.svg;
          const setClass = `set-filter ${
            filtered.indexOf(set.code.toLowerCase()) == -1
              ? "set-filter-on"
              : ""
          }`;
          return (
            <div
              key={set.code.toLowerCase()}
              style={{
                backgroundImage: `url(data:image/svg+xml;base64,${svgData})`,
              }}
              title={set.name}
              className={setClass}
              onClick={(): void => setFilteredSet(set.code.toLowerCase())}
            />
          );
        })}
      </div>
    </div>
  );
}
