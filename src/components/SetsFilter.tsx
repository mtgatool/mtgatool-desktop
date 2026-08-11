import { isEqual } from "lodash";
import { CSSProperties, useCallback, useMemo, useState } from "react";

import useCardsDbReady from "../hooks/useCardsDbReady";
import { CardSet } from "../types";
import getLocalSetting from "../utils/getLocalSetting";
import getSetFormatBand, { SetFormatBand } from "../utils/getSetFormatBand";
import database from "../utils/mtga/database";
import setLocalSetting from "../utils/setLocalSetting";

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

  const allSets: Set[] = filterSets
    .filter((s) => s?.code)
    .sort((a, b) => {
      return new Date(a.release).getTime() - new Date(b.release).getTime();
    });

  // Grouped by what you can actually play them in, widest format last, so the
  // bands run from the sets that matter to most players down to the leftovers.
  // Each band excludes the ones above it, so a set appears once, in the
  // narrowest format that admits it (see getSetFormatBand).
  //
  // Alchemy releases sit in none of the three, and there are seventeen of
  // them against two true leftovers — folding them into "Other" would make
  // that label describe mostly Alchemy.
  const standardSets: Set[] = [];
  const explorerSets: Set[] = [];
  const historicSets: Set[] = [];
  const alchemySets: Set[] = [];
  const otherSets: Set[] = [];

  const bandLists: Record<SetFormatBand, Set[]> = {
    standard: standardSets,
    explorer: explorerSets,
    historic: historicSets,
    alchemy: alchemySets,
    other: otherSets,
  };

  allSets.forEach((s) => {
    bandLists[getSetFormatBand(s.code)].push(s);
  });

  // Standard and Explorer are what most people are picking from; the rest are
  // long tails that made the picker three times taller than it needed to be.
  const defaultOpenBands = ["Standard", "Explorer"];

  const [bands, setBands] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(getLocalSetting("collectionSetBands")) || {};
    } catch (e) {
      return {};
    }
  });

  const isOpen = (label: string): boolean =>
    bands[label] ?? defaultOpenBands.includes(label);

  const toggleBand = useCallback(
    (label: string): void => {
      setBands((current) => {
        const open = current[label] ?? defaultOpenBands.includes(label);
        const next = { ...current, [label]: !open };
        setLocalSetting("collectionSetBands", JSON.stringify(next));
        return next;
      });
    },
    // defaultOpenBands is a literal defined above and never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * One labelled band of set icons, which can be folded away.
   *
   * The bands were there already but unnamed, so the whole thing read as one
   * undifferentiated wall of eighty glyphs with invisible seams between the
   * groups. Naming them made it scannable; folding the older ones away means
   * the picker opens at the size of what most people are looking for.
   */
  const division = (label: string, sets: Set[]): JSX.Element | null => {
    if (!sets.length) return null;
    const open = isOpen(label);
    const selectedHere = sets.filter(
      (s) => filtered.indexOf(s.code.toLowerCase()) !== -1
    ).length;

    return (
      <div className="set-division" key={label}>
        <div
          className="set-division-label"
          role="button"
          tabIndex={0}
          title={open ? `Hide ${label} sets` : `Show ${label} sets`}
          onClick={(): void => toggleBand(label)}
          onKeyPress={(): void => toggleBand(label)}
        >
          <div className={`set-division-caret ${open ? "open" : ""}`} />
          {label}
          {/* A closed band would otherwise hide the fact that something inside
              it is filtering the list. */}
          {!open && selectedHere > 0 ? (
            <span className="set-division-count">{selectedHere}</span>
          ) : null}
        </div>
        {open ? (
          <div className="set-division-icons">
            {sets.map((set) => {
              const code = set.code.toLowerCase();
              const selected = filtered.indexOf(code) !== -1;
              return (
                <div
                  key={code}
                  style={{
                    backgroundImage: `url(data:image/svg+xml;base64,${set.svg})`,
                  }}
                  title={set.name}
                  className={`set-filter ${
                    selected ? "set-filter-selected" : ""
                  }`}
                  onClick={(): void => setFilteredSet(code)}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className="set-filter-container"
      style={{
        ...style,
      }}
    >
      {division("Standard", standardSets)}
      {division("Explorer", explorerSets)}
      {division("Historic", historicSets.sort(sortSetByName))}
      {division("Alchemy", alchemySets.sort(sortSetByName))}
      {division("Other", otherSets.sort(sortSetByName))}
    </div>
  );
}
