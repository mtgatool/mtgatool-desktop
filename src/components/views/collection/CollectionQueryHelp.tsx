import { ReactNode } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import { ReactComponent as Close } from "../../../assets/images/svg/close.svg";
import reduxAction from "../../../redux/reduxAction";

interface CollectionQueryHelpProps {
  closeCallback: () => void;
}

interface Row {
  /** The token(s) that trigger the filter, shown as inline code. */
  keys: string[];
  /** Plain-language description of what it matches. */
  desc: string;
  /** Example queries, shown as inline code. */
  examples: string[];
}

// The operators the parser understands. `:` and `=` behave the same for most
// text filters; the comparison operators only mean something for the numeric
// (cmc / owned) and colour filters.
const OPERATORS: Row[] = [
  {
    keys: [":"],
    desc: "Contains / matches. On colours it means “any of these”; on numbers it means “equal to”.",
    examples: ["t:creature", "c:wu", "cmc:3"],
  },
  {
    keys: ["="],
    desc: "Exactly equal. On colours it means the card is exactly these colours.",
    examples: ["c=r", "cmc=2"],
  },
  {
    keys: ["!="],
    desc: "Not equal to.",
    examples: ["r!=common", "c!=g"],
  },
  {
    keys: [">", ">=", "<", "<="],
    desc: "Numeric comparisons for cmc / owned, and set relationships for colours (superset / subset).",
    examples: ["cmc>=5", "owned<4", "c>=wu"],
  },
  {
    keys: ["-"],
    desc: "Prefix any filter with a minus to negate it.",
    examples: ["-t:land", "-is:booster", "-dragon"],
  },
];

// Every keyword the query parser resolves to a working filter, in the order a
// player is likely to reach for them.
const FILTERS: Row[] = [
  {
    keys: ["name:", "(bare text)"],
    desc: "Card name (partial match). Any text with no keyword searches the name.",
    examples: ["dragon", 'name:"ur-dragon"'],
  },
  {
    keys: ["t:", "type:"],
    desc: "Type line (partial match).",
    examples: ["t:creature", 't:"legendary artifact"'],
  },
  {
    keys: ["a:", "artist:"],
    desc: "Artist name (partial match).",
    examples: ['a:"rebecca guay"'],
  },
  {
    keys: ["c:", "m:", "mana:"],
    desc: "Colours / colour identity. See the colour values and operators below.",
    examples: ["c:wu", "c=r", "m>=g"],
  },
  {
    keys: ["cmc:"],
    desc: "Mana value (converted mana cost).",
    examples: ["cmc:3", "cmc>=5", "cmc<2"],
  },
  {
    keys: ["owned:", "q:"],
    desc: "Number of copies you own.",
    examples: ["owned>=4", "owned<2"],
  },
  {
    keys: ["r:", "rarity:"],
    desc: "Rarity. Comparisons order token < land < common < uncommon < rare < mythic.",
    examples: ["r:mythic", "r>=rare", "r!=common"],
  },
  {
    keys: ["s:", "set:"],
    desc: "Set code(s), comma-separated.",
    examples: ["s:dmu", "set:neo,snc"],
  },
  {
    keys: ["f:", "format:", "legal:"],
    desc: "Cards legal in a format.",
    examples: ["f:standard", "legal:historic"],
  },
  {
    keys: ["banned:"],
    desc: "Cards banned in a format.",
    examples: ["banned:standard"],
  },
  {
    keys: ["suspended:"],
    desc: "Cards suspended in a format.",
    examples: ["suspended:historic"],
  },
  {
    keys: ["is:craftable"],
    desc: "Cards you can craft with wildcards.",
    examples: ["is:craftable"],
  },
  {
    keys: ["in:booster", "is:booster"],
    desc: "Cards that appear in boosters.",
    examples: ["in:booster", "-in:booster"],
  },
];

const COLOR_VALUES: Row[] = [
  {
    keys: ["w", "u", "b", "r", "g", "c"],
    desc: "Single letters: white, blue, black, red, green, colorless. Combine them freely.",
    examples: ["c:wu", "c=wubrg"],
  },
  {
    keys: ["white", "blue", "black", "red", "green", "colorless"],
    desc: "Full colour names (one at a time).",
    examples: ["c:green"],
  },
  {
    keys: ["azorius", "izzet", "…", "jeskai", "sultai"],
    desc: "Guild, shard and wedge names expand to their colours.",
    examples: ["c:izzet", "c=jeskai"],
  },
];

// A handful of complete queries, so the pieces above read as something you'd
// actually type.
const EXAMPLES: Row[] = [
  {
    keys: ["c:r t:creature cmc<=3"],
    desc: "Red creatures costing 3 or less.",
    examples: [],
  },
  {
    keys: ["f:standard r:mythic owned<4"],
    desc: "Standard-legal mythics you don’t have a playset of yet.",
    examples: [],
  },
  {
    keys: ["s:dmu -is:booster"],
    desc: "Cards from Dominaria United that don’t appear in boosters.",
    examples: [],
  },
];

// How each operator reads against a colour set, using WU as the example.
const COLOR_OPERATORS: Row[] = [
  {
    keys: ["c=wu"],
    desc: "Exactly white and blue, nothing else.",
    examples: [],
  },
  { keys: ["c:wu"], desc: "Any of white or blue.", examples: [] },
  { keys: ["c!=wu"], desc: "Not exactly white and blue.", examples: [] },
  { keys: ["c>=wu"], desc: "White and blue, and possibly more.", examples: [] },
  {
    keys: ["c>wu"],
    desc: "Strictly more colours than white and blue.",
    examples: [],
  },
  { keys: ["c<=wu"], desc: "At most white and blue.", examples: [] },
  {
    keys: ["c<wu"],
    desc: "Strictly fewer colours than white and blue.",
    examples: [],
  },
];

// A runnable chip carries an onClick; a plain one (a syntax token like `t:`)
// does not. Runnable chips read as links and run the query when clicked.
function Code({
  text,
  onClick,
}: {
  text: string;
  onClick?: () => void;
}): JSX.Element {
  if (!onClick) {
    return <code className="collection-query-help-code">{text}</code>;
  }
  return (
    <code
      className="collection-query-help-code collection-query-help-code-link"
      role="button"
      tabIndex={0}
      title="Run this search"
      onClick={onClick}
      onKeyDown={(e): void => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {text}
    </code>
  );
}

function RowsTable({
  rows,
  onApply,
  runnableKeys,
}: {
  rows: Row[];
  onApply: (query: string) => void;
  // When set, the `keys` chips are themselves complete, runnable queries
  // (the Examples and Colour-operator sections), not syntax tokens.
  runnableKeys?: boolean;
}): JSX.Element {
  return (
    <div className="collection-query-help-table">
      {rows.map((row) => (
        <div className="collection-query-help-row" key={row.keys.join("|")}>
          <div className="collection-query-help-keys">
            {row.keys.map((k) => (
              <Code
                text={k}
                key={k}
                onClick={runnableKeys ? (): void => onApply(k) : undefined}
              />
            ))}
          </div>
          <div className="collection-query-help-desc">
            <div>{row.desc}</div>
            {row.examples.length > 0 && (
              <div className="collection-query-help-examples">
                {row.examples.map((e) => (
                  <Code text={e} key={e} onClick={(): void => onApply(e)} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// One boxed, colour-accented block per topic — the same idea as Scryfall's
// section boxes, tinted with our WUBRG palette so the categories read apart.
function HelpSection({
  title,
  accent,
  rows,
  onApply,
  runnableKeys,
}: {
  title: ReactNode;
  accent: string;
  rows: Row[];
  onApply: (query: string) => void;
  runnableKeys?: boolean;
}): JSX.Element {
  return (
    <div
      className="collection-query-help-section"
      style={{ borderLeftColor: accent }}
    >
      <div
        className="collection-query-help-section-title"
        style={{ color: accent }}
      >
        {title}
      </div>
      <RowsTable rows={rows} onApply={onApply} runnableKeys={runnableKeys} />
    </div>
  );
}

export default function CollectionQueryHelp(
  props: CollectionQueryHelpProps
): JSX.Element {
  const { closeCallback } = props;
  const dispatch = useDispatch();
  const history = useHistory();

  // Running an example does the same three things typing one and pressing
  // Enter does — set the query, push it into the URL so the search is
  // shareable, and here also dismiss the popup that launched it.
  const apply = (query: string): void => {
    reduxAction(dispatch, { type: "SET_COLLECTION_QUERY", arg: { query } });
    history.push(`/collection/${query}`);
    closeCallback();
  };

  return (
    <div className="collection-query-help">
      <div className="close-button" onClick={closeCallback}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="message-sub">Collection Search Syntax</div>
      <div className="collection-query-help-intro">
        Combine any of the filters below, separated by spaces — every card must
        match all of them. Click any{" "}
        <span className="collection-query-help-code collection-query-help-code-link">
          example
        </span>{" "}
        to run it. The syntax mimics{" "}
        <a
          className="link"
          href="https://scryfall.com/docs/syntax"
          target="_blank"
          rel="noreferrer"
        >
          Scryfall
        </a>
        .
      </div>

      <HelpSection
        title="Filters"
        accent="var(--color-u)"
        rows={FILTERS}
        onApply={apply}
      />

      <HelpSection
        title="Operators"
        accent="var(--color-r)"
        rows={OPERATORS}
        onApply={apply}
      />

      <HelpSection
        title="Colour values"
        accent="var(--color-g)"
        rows={COLOR_VALUES}
        onApply={apply}
      />

      <HelpSection
        title={
          <>
            Colour operators (example: <Code text="wu" /> = white + blue)
          </>
        }
        accent="var(--color-w)"
        rows={COLOR_OPERATORS}
        onApply={apply}
        runnableKeys
      />

      <HelpSection
        title="Examples"
        accent="var(--color-b)"
        rows={EXAMPLES}
        onApply={apply}
        runnableKeys
      />
    </div>
  );
}
