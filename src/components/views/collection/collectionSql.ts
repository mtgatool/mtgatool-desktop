/* eslint-disable no-bitwise */
/**
 * Translate the collection's filters and sort into SQL.
 *
 * This is the SQL half of `utils/tables/doCollectionFilter.ts`, and it is
 * deliberately a translation rather than a redesign: the query parser
 * (`collectionQuery.ts`) still produces the same `Filters<CardsData>`, and each
 * filter here reproduces exactly what its filter function does in JS — down to
 * the quirks, like the set filter ignoring its own `mode`, and `or` / `not`
 * colour modes that do not actually depend on the row.
 *
 * Keeping the semantics identical is what makes the two paths comparable while
 * both exist.
 */
import { CardsData } from "../../../types/collectionTypes";
import { Filters } from "../../../types/genericFilterTypes";
import cardsDb from "../../../utils/cardsDb/cardsDbClient";
import { Sort } from "../../SortControls";

export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

/** Column expressions, keyed by the CardsData field they back. */
const COLUMNS: Record<string, string> = {
  id: "c.grpid",
  cmc: "c.cmc",
  cid: "c.cid",
  fullName: "c.full_name",
  fullType: "c.full_type",
  artist: "c.artist",
  colors: "c.color_bits",
  colorSortVal: "c.color_sort",
  rankSortVal: "c.rank_sort",
  rarityVal: "c.rarity_val",
  craftable: "c.craftable",
  booster: "c.booster",
  owned: "COALESCE(col.owned, 0)",
  acquired: "COALESCE(col.owned, 0) - COALESCE(col.prev, 0)",
  setCode: "set_codes",
};

/**
 * Column order here is load-bearing — `rowToCardsData` reads by index, because
 * the worker returns tuples rather than objects to keep the clone cheap.
 */
const SELECT = `
  SELECT c.grpid,
         c.cmc,
         c.cid,
         c.full_name,
         c.full_type,
         c.artist,
         ${COLUMNS.owned},
         ${COLUMNS.acquired},
         c.color_bits,
         c.color_sort,
         c.rank_sort,
         c.rarity_val,
         c.craftable,
         c.booster,
         c.titleid,
         (SELECT group_concat(a.alias ORDER BY a.alias)
            FROM card_set_aliases a WHERE a.grpid = c.grpid) AS set_codes,
         c.legal_0, c.legal_1, c.legal_2, c.legal_3, c.legal_4, c.legal_5
    FROM cards c
    LEFT JOIN collection col ON col.grpid = c.grpid`;

const IDX = {
  grpid: 0,
  cmc: 1,
  cid: 2,
  fullName: 3,
  fullType: 4,
  artist: 5,
  owned: 6,
  acquired: 7,
  colors: 8,
  colorSort: 9,
  rankSort: 10,
  rarityVal: 11,
  craftable: 12,
  booster: 13,
  titleid: 14,
  setCodes: 15,
  legal0: 16,
};

/** Numeric comparison modes, shared by the minmax and rarity filters. */
function numericPredicate(
  column: string,
  mode: string,
  params: unknown[],
  value: number
): string {
  params.push(value);
  switch (mode) {
    case "=":
      return `${column} = ?`;
    // ":" is a bit test in the JS filters, not equality.
    case ":":
      return `(${column} & ?) <> 0`;
    case "!=":
      return `${column} <> ?`;
    case "<=":
      return `${column} <= ?`;
    case "<":
      return `${column} < ?`;
    case ">=":
      return `${column} >= ?`;
    case ">":
      return `${column} > ?`;
    default:
      // The JS filters start from `ret = true` and leave it alone for an
      // unrecognised mode.
      params.pop();
      return "1";
  }
}

function colorsPredicate(
  mode: string,
  color: number,
  params: unknown[]
): string {
  const column = COLUMNS.colors;
  switch (mode) {
    case "strict":
      params.push(color);
      return `${column} = ?`;
    case "and":
      params.push(color);
      return `(? & ${column}) <> 0`;
    case "or":
      params.push(color);
      return `(? | ${column}) <> 0`;
    // `not` evaluates ~F, which never looks at the row at all. Folded to a
    // constant rather than pretending it is a predicate.
    case "not":
      return ~color !== 0 ? "1" : "0";
    case "strictNot":
      params.push(color);
      return `${column} <> ?`;
    case "subset":
      params.push(color, color);
      return `(? | ${column}) = ?`;
    case "strictSubset":
      params.push(color, color, color);
      return `(? | ${column}) = ? AND ${column} <> ?`;
    case "superset":
      params.push(color, color);
      return `(? & ${column}) = ?`;
    case "strictSuperset":
      params.push(color, color, color);
      return `(? & ${column}) = ? AND ${column} <> ?`;
    default:
      return "1";
  }
}

/** A legality test against the bitmask, or a predicate that matches nothing. */
function legalityPredicate(formatName: string): string {
  const format = cardsDb.formatByName.get(formatName.toLowerCase());
  if (!format) return "0";
  return `(c.legal_${format.word} & ${format.mask}) <> 0`;
}

function formatCardsPredicate(
  kind: "banned" | "suspended",
  formatName: string,
  params: unknown[]
): string {
  params.push(kind, formatName.toLowerCase());
  return `EXISTS (
    SELECT 1 FROM format_cards fc
      JOIN formats f ON f.id = fc.format_id
     WHERE fc.title_id = c.titleid AND fc.kind = ? AND lower(f.name) = ?)`;
}

function wrapNot(predicate: string, not: boolean): string {
  return not ? `NOT (${predicate})` : `(${predicate})`;
}

function buildWhere(filters: Filters<CardsData>, params: unknown[]): string {
  // `listable` is the LinkedFaceType filter getCollectionData applies before it
  // maps anything — DFC backs, melds, adventures and the rest are never rows.
  //
  // The nameless entries are the four wildcard placeholders Arena keeps in set
  // WC, one per rarity. They are cards to the database and were sorting to the
  // front of an unfiltered collection as four blanks. Nothing can be shown for
  // a card with no name, so nothing should try.
  const clauses: string[] = ["c.listable = 1", "c.name <> ''"];

  filters.forEach((filter) => {
    switch (filter.type) {
      case "string": {
        if (
          filter.id !== "fullName" &&
          filter.id !== "fullType" &&
          filter.id !== "artist"
        ) {
          return;
        }
        const column = COLUMNS[filter.id];
        const needle = filter.value.string.toLowerCase();
        // These columns are stored already lowercased, matching what the JS
        // filter compares against.
        let predicate: string;
        if (filter.value.exact) {
          params.push(needle);
          predicate = `${column} = ?`;
        } else {
          params.push(needle);
          predicate = `instr(${column}, ?) > 0`;
        }
        clauses.push(wrapNot(predicate, filter.value.not));
        break;
      }

      case "instringarray": {
        const name = filter.value.value;
        let predicate: string;
        if (filter.id === "format" || filter.id === "legal") {
          predicate = legalityPredicate(name);
        } else if (filter.id === "banned") {
          predicate = formatCardsPredicate("banned", name, params);
        } else if (filter.id === "suspended") {
          predicate = formatCardsPredicate("suspended", name, params);
        } else {
          return;
        }
        clauses.push(wrapNot(predicate, filter.value.not));
        break;
      }

      case "inbool": {
        if (filter.id !== "craftable" && filter.id !== "booster") return;
        params.push(filter.value.value ? 1 : 0);
        clauses.push(wrapNot(`${COLUMNS[filter.id]} = ?`, filter.value.not));
        break;
      }

      case "minmax": {
        if (filter.id !== "cmc" && filter.id !== "owned") return;
        const predicate = numericPredicate(
          COLUMNS[filter.id],
          filter.value.mode,
          params,
          filter.value.value
        );
        clauses.push(wrapNot(predicate, filter.value.not));
        break;
      }

      case "colors": {
        if (filter.id !== "colors") return;
        const predicate = colorsPredicate(
          filter.value.mode,
          filter.value.color,
          params
        );
        clauses.push(wrapNot(predicate, filter.value.not));
        break;
      }

      case "rarity": {
        if (filter.id !== "rarityVal") return;
        const predicate = numericPredicate(
          COLUMNS.rarityVal,
          filter.value.mode,
          params,
          filter.value.rarity
        );
        clauses.push(wrapNot(predicate, filter.value.not));
        break;
      }

      case "array": {
        if (filter.id !== "setCode") return;
        const codes = filter.value.arr;
        if (codes.length === 0) {
          // setFilterFn's `res` stays false when there is nothing to match.
          clauses.push(wrapNot("0", filter.value.not));
          break;
        }
        // Matching is case-sensitive, like the `includes` it replaces; the
        // stored aliases are lowercase. `mode` is ignored, as it is in JS.
        codes.forEach((code) => params.push(code));
        clauses.push(
          wrapNot(
            `EXISTS (SELECT 1 FROM card_set_aliases a
                      WHERE a.grpid = c.grpid
                        AND a.alias IN (${codes.map(() => "?").join(",")}))`,
            filter.value.not
          )
        );
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.error("Unknown filter: ", filter);
        break;
    }
  });

  return clauses.join("\n     AND ");
}

function buildOrderBy(sort: Sort<CardsData>): string {
  const column = COLUMNS[sort.key as string];
  if (!sort.key || !column) return "";
  const direction = sort.sort === 1 ? "ASC" : "DESC";
  // lodash's orderBy pushes undefined to the end; SQLite would put NULLs first
  // on an ascending sort.
  return `\n ORDER BY ${column} ${direction} NULLS LAST, c.grpid ASC`;
}

export interface Page {
  limit: number;
  offset: number;
}

/**
 * The rows for one page of the collection.
 *
 * The limit is what makes this cheap. Selecting every matching row costs about
 * 1.1s for an unfiltered collection — not because SQLite is slow (the same
 * query returning only grpid takes 56ms) but because ~470k cells have to cross
 * the wasm boundary and 25k tuples have to be cloned back. A page of 60 is
 * 18ms. Nothing above this ever needs more than a page, so nothing above this
 * ever asks for more.
 */
export function buildCollectionQuery(
  filters: Filters<CardsData>,
  sort: Sort<CardsData>,
  page?: Page
): BuiltQuery {
  const params: unknown[] = [];
  const where = buildWhere(filters, params);
  let sql = `${SELECT}\n   WHERE ${where}${buildOrderBy(sort)}`;
  if (page) {
    sql += `\n   LIMIT ? OFFSET ?`;
    params.push(page.limit, page.offset);
  }
  return { sql, params };
}

/**
 * Just the ids of every matching row, for the things that genuinely need the
 * whole set: the total for the pager, and the per-set completion stats. One
 * column instead of twenty, and no ORDER BY, because neither caller cares
 * about order.
 */
export function buildCollectionIdsQuery(
  filters: Filters<CardsData>
): BuiltQuery {
  const params: unknown[] = [];
  const where = buildWhere(filters, params);
  return {
    sql: `SELECT c.grpid
    FROM cards c
    LEFT JOIN collection col ON col.grpid = c.grpid
   WHERE ${where}`,
    params,
  };
}

/** Map the worker's tuples back into the shape the collection views expect. */
export function rowsToCardsData(values: unknown[][]): CardsData[] {
  return values.map((row) => {
    const titleId = row[IDX.titleid] as number;
    const setCodes = row[IDX.setCodes] as string | null;
    const legal = cardsDb.decodeFormats([
      row[IDX.legal0] as number,
      row[IDX.legal0 + 1] as number,
      row[IDX.legal0 + 2] as number,
      row[IDX.legal0 + 3] as number,
      row[IDX.legal0 + 4] as number,
      row[IDX.legal0 + 5] as number,
    ]);

    return {
      id: row[IDX.grpid] as number,
      cmc: row[IDX.cmc] as number,
      cid: row[IDX.cid] === null ? NaN : (row[IDX.cid] as number),
      fullName: row[IDX.fullName] as string,
      fullType: row[IDX.fullType] as string,
      artist: row[IDX.artist] as string,
      owned: row[IDX.owned] as number,
      acquired: row[IDX.acquired] as number,
      colors: row[IDX.colors] as number,
      colorSortVal: row[IDX.colorSort] as string,
      rankSortVal: row[IDX.rankSort] as string,
      rarityVal: row[IDX.rarityVal] as number,
      setCode: setCodes ? setCodes.split(",") : [],
      format: legal,
      legal,
      banned: cardsDb.bannedByTitle.get(titleId) || [],
      suspended: cardsDb.suspendedByTitle.get(titleId) || [],
      craftable: !!row[IDX.craftable],
      booster: !!row[IDX.booster],
    };
  });
}
