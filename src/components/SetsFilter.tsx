import { isEqual } from "lodash";
import { CSSProperties, useMemo } from "react";

import allFormats from "../common/allFormats";
import useCardsDbReady from "../hooks/useCardsDbReady";
import { CardSet } from "../types";
import database from "../utils/mtga/database";

interface SetsFilterProps {
  singleSelection?: boolean;
  style?: CSSProperties;
  callback: (sets: string[]) => void;
  filtered: string[];
}

type Set = CardSet & { name: string };

// The faces getCollectionData drops, so they never appear as their own row.
/**
 * The sets Arena actually distributes cards in.
 *
 * This used to be "sets with `collation > 0`", plus a hardcoded list of twelve
 * Jumpstart/Anthology names. `collation` is the MTGA booster id, and it stopped
 * being retrievable when it was dropped from the logs — so no set since Alchemy:
 * Duskmourn (Oct 2024) has one, and the filter silently lost two years of sets.
 * Special Guests fell in the same hole, which is why Chrome Mox was searchable
 * but unreachable by set.
 *
 * A card's set is its ORIGINAL printing, so going by that alone would list
 * Coldsnap, Mirage and Alara Reborn — paper sets Arena never shipped, present
 * only because something reprinted them. What Arena actually distributes is the
 * DigitalSet when there is one, which is the same "effective set" idea
 * getCardInBoosters already uses. Coldsnap's cards, for instance, carry AHA4 —
 * the Historic Anthology that brought them in.
 *
 * Derived from the card database rather than listed by hand, so a new set
 * appears the moment its cards do and this cannot rot again.
 *
 * Metadata v231+ settles this at build time and ships `collectible` per set,
 * which is both authoritative and free; the walk below is the fallback for
 * databases generated before that field existed.
 */
function getDistributedSets(): string[] {
  const { sets } = database;
  return Object.keys(sets).filter((name) => sets[name].collectible);
}

export default function SetsFilter(props: SetsFilterProps): JSX.Element {
  const { singleSelection, style, callback, filtered } = props;
  // Sets are empty until the database loads, and the memo below is keyed on the
  // version, which is 0 until then — without this the filter renders once, with
  // no sets, and never again.
  useCardsDbReady();

  // const formats = useSelector((state: AppState) => state.renderer.formats);
  const filterable = useMemo(
    getDistributedSets,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [database.version]
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

  const sortSetByName = (a: Set, b: Set): number => {
    return a.name.localeCompare(b.name);
  };

  const otherSets: Set[] = [];
  const allSets: Set[] = filterSets
    .filter((s) => s?.code)
    .sort((a, b) => {
      return new Date(a.release).getTime() - new Date(b.release).getTime();
    });

  const standardSets: Set[] = [];
  const historicSets: Set[] = [];
  const alchemySets: Set[] = [];

  const standard = allFormats.Standard.legalSets;
  // const _historic = allFormats.Historic.sets;
  // const _alchemy = allFormats.Alchemy.sets;
  // const _explorer = allFormats.Explorer.sets;

  allSets.forEach((s) => {
    if (standard.includes(s.arenacode) || standard.includes(s.code)) {
      standardSets.push(s);
    } else if (s.arenacode.startsWith("Y2") || s.code.startsWith("Y2")) {
      alchemySets.push(s);
    } else if (
      s.arenacode.startsWith("AHA") ||
      s.code.startsWith("AHA") ||
      s.code.startsWith("EA") ||
      s.code.startsWith("EA")
    ) {
      historicSets.push(s);
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
        {historicSets.sort(sortSetByName).map((set) => {
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
        {alchemySets.sort(sortSetByName).map((set) => {
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
