import SegmentedToggle from "./SegmentedToggle";

export type MatchFormat = "constructed" | "limited";

const OPTIONS: [MatchFormat, string][] = [
  ["constructed", "Constructed"],
  ["limited", "Limited"],
];

// Constructed | Limited switch. The two ladders (and their decks) share
// nothing, so views use this to show one format at a time.
export default function FormatToggle({
  format,
  onChange,
  style,
}: {
  format: MatchFormat;
  onChange: (format: MatchFormat) => void;
  style?: React.CSSProperties;
}): JSX.Element {
  return (
    <SegmentedToggle
      options={OPTIONS}
      value={format}
      onChange={onChange}
      style={style}
    />
  );
}
