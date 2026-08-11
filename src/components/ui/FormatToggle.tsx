export type MatchFormat = "constructed" | "limited";

// Constructed | Limited segmented switch. The two ladders (and their decks)
// share nothing, so views use this to show one format at a time. The thumb
// slides to the chosen side; styles live in scss/formatToggle.scss.
export default function FormatToggle({
  format,
  onChange,
  style,
}: {
  format: MatchFormat;
  onChange: (format: MatchFormat) => void;
  style?: React.CSSProperties;
}): JSX.Element {
  const options: [MatchFormat, string][] = [
    ["constructed", "Constructed"],
    ["limited", "Limited"],
  ];
  return (
    <div className="format-toggle" style={style}>
      <div className={`format-toggle-thumb ${format}`} />
      {options.map(([key, label]) => (
        <div
          key={key}
          onClick={() => onChange(key)}
          className={`format-toggle-option ${format === key ? "active" : ""}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
