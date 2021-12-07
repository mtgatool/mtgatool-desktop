import { CSSProperties } from "react";
import { isEqual } from "lodash";
import { CardSet, database } from "mtgatool-shared";

interface SetsFilterProps {
  singleSelection?: boolean;
  style?: CSSProperties;
  callback: (sets: string[]) => void;
  filtered: string[];
}

export default function SetsFilter(props: SetsFilterProps): JSX.Element {
  const { singleSelection, style, callback, filtered } = props;
  // const formats = useSelector((state: AppState) => state.renderer.formats);
  // All sets after Ixalan
  const filterable = Object.keys(database.sets).filter(
    (set) => database.sets[set].collation > 0
  );

  filterable.push(
    "Jumpstart",
    "Historic Anthology 1",
    "Historic Anthology 2",
    "Historic Anthology 3",
    "Historic Anthology 4",
    "Historic Anthology 5"
  );
  const filterSets: (CardSet & { name: string })[] = filterable.map((set) => {
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

  return (
    <div
      className="set-filter-container"
      style={{
        ...style,
      }}
    >
      {filterSets.map((set) => {
        const svgData = set.svg;
        const setClass = `set-filter ${
          filtered.indexOf(set.code.toLowerCase()) == -1 ? "set-filter-on" : ""
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
  );
}
