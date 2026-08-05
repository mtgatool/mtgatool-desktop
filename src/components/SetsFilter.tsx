import { isEqual } from "lodash";
import { CSSProperties, useMemo } from "react";

import allFormats from "../common/allFormats";
import {
  FACE_ADVENTURE,
  FACE_DFC_BACK,
  FACE_MODAL_BACK,
  FACE_ROOM,
  FACE_SPECIALIZE_BACK,
  FACE_SPLIT,
} from "../constants";
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
const NON_LISTED_FACES = [
  FACE_DFC_BACK,
  3, // meld
  FACE_ADVENTURE,
  FACE_SPLIT,
  FACE_ROOM,
  FACE_MODAL_BACK,
  FACE_SPECIALIZE_BACK,
];

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
  const { cards, setNames } = database.metadata || { cards: {}, setNames: {} };
  const { sets } = database;

  const preresolved = Object.keys(sets).filter(
    (name) => sets[name].collectible !== undefined
  );
  if (preresolved.length > 0) {
    return preresolved.filter((name) => sets[name].collectible);
  }

  const names = new Set<string>();

  Object.values(cards).forEach((card) => {
    if (!card || !card.Name || card.IsToken) return;
    // A set represented only by faces the collection never lists on their own
    // has nothing to show behind its icon. Hour of Devastation is the whole of
    // this case today: its only two cards are the halves of Consign // Oblivion.
    if (NON_LISTED_FACES.includes(card.LinkedFaceType)) return;
    // Only cards the set actually owns. `IsPrimaryCard` false means this is an
    // alternate printing of a card whose real entry lives in another set, which
    // is all Arena ever took from Commander Masters, Clue Edition and Tales of
    // Middle-earth Commander — thirteen reprints of cards you already see
    // elsewhere. Basic-land art (`Rarity === "land"`) is the same story for the
    // Un-sets and the crossover land drops. getCardInBoosters draws the line in
    // the same place, and getCollectionStats already skips lands outright.
    if (!card.IsPrimaryCard || card.Rarity === "land") return;
    const effective =
      card.DigitalSet && card.DigitalSet !== "" ? card.DigitalSet : card.Set;
    if (!effective) return;
    // Digital releases carry a suffix the set table does not ("SPG-MKM",
    // "Y26-ECL"); fall back to the part before it.
    const name =
      setNames[effective] || setNames[effective.split("-")[0]] || undefined;
    if (name && sets[name]) names.add(name);
  });

  return [...names];
}

export default function SetsFilter(props: SetsFilterProps): JSX.Element {
  const { singleSelection, style, callback, filtered } = props;
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
