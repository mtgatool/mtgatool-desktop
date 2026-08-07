/**
 * What the four marks above each card mean.
 *
 * Three of them were always there and never explained; the fourth — a copy held
 * as a different printing — is new enough that nothing could be expected to
 * guess it. The blue "wanted" mark is deliberately absent: the collection grid
 * never passes a wanted count, so it cannot appear here, and a legend that
 * describes states you will not see is worse than a short one.
 */
const STATES: { className: string; label: string }[] = [
  { className: "inventory-card-quantity-green", label: "In your collection" },
  {
    className: "inventory-card-quantity-orange",
    label: "Recently acquired",
  },
  {
    className: "inventory-card-quantity-green-dim",
    label: "Owned as another printing",
  },
  { className: "inventory-card-quantity-gray", label: "Not owned" },
];

export default function OwnershipLegend(): JSX.Element {
  return (
    <div className="ownership-legend">
      {STATES.map((state) => (
        <div className="ownership-legend-item" key={state.className}>
          <div className={`ownership-legend-pip ${state.className}`} />
          {state.label}
        </div>
      ))}
    </div>
  );
}
