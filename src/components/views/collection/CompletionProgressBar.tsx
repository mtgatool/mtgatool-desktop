import { ALL_CARDS, FULL_SETS, SINGLETONS } from "./collectionStats";
import CountStats from "./CountStats";

interface CompletionProgressBarProps {
  countMode: string;
  countStats: CountStats;
  image: string;
  title: string;
  /** Rarity this row counts, when it counts one. Tints the meter to match. */
  rarity?: string;
}

export default function CompletionProgressBar(
  props: CompletionProgressBarProps
): JSX.Element {
  const { countMode, countStats, image, title, rarity } = props;
  if (!countStats) return <></>;

  let numerator;
  let denominator;
  switch (countMode) {
    case SINGLETONS:
      numerator = countStats.uniqueOwned;
      denominator = countStats.unique;
      break;
    case FULL_SETS:
      numerator = countStats.complete;
      denominator = countStats.unique;
      break;
    default:
    case ALL_CARDS:
      numerator = countStats.owned;
      denominator = countStats.total;
      break;
  }

  // Nothing to complete is not 0% of anything — dividing gave NaN, and the row
  // read "0 / 0 NaN%".
  const completionRatio = denominator > 0 ? numerator / denominator : 0;
  const percent = denominator
    ? completionRatio.toLocaleString([], {
        style: "percent",
        maximumSignificantDigits: 2,
      })
    : "—";

  return (
    <div className="set-completion">
      <div className="set-completion-head">
        <div
          className="set-completion-icon"
          style={{ backgroundImage: image }}
        />
        <div className="set-completion-title">{title}</div>
        <div className="set-completion-figures">
          <span className="set-completion-count">
            {numerator} <span className="set-completion-of">/</span>{" "}
            {denominator}
          </span>
          <span className="set-completion-percent">{percent}</span>
        </div>
      </div>
      <div className="set-completion-meter">
        <div
          className="set-completion-meter-fill"
          style={{
            width: `${Math.round(completionRatio * 100)}%`,
            background: rarity ? `var(--color-${rarity})` : undefined,
          }}
        />
      </div>
    </div>
  );
}
