import Flex from "../../Flex";
import { ALL_CARDS, FULL_SETS, SINGLETONS } from "./collectionStats";
import CountStats from "./CountStats";

interface CompletionProgressBarProps {
  countMode: string;
  countStats: CountStats;
  image: string;
  title: string;
}

export default function CompletionProgressBar(
  props: CompletionProgressBarProps
): JSX.Element {
  const { countMode, countStats, image, title } = props;
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

  const completionRatio = numerator / denominator;

  return (
    <div
      style={{
        width: "-webkit-fill-available",
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Flex
        style={{
          display: "flex",
          justifyContent: "space-between",
          minWidth: "160px",
          margin: "auto",
        }}
      >
        <div className="stats-set-icon" style={{ backgroundImage: image }} />
        <span>{title}</span>
      </Flex>
      <div>
        <div className="stats-set-details">
          <div>
            <span>
              {numerator} / {denominator}
            </span>
            <span style={{ color: "var(--color-text-dark)" }}>
              {completionRatio.toLocaleString([], {
                style: "percent",
                maximumSignificantDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="stats-set-bar-container">
        <div
          className="stats-set-bar"
          style={{ width: `${Math.round(completionRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
