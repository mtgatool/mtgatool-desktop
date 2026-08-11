// Segmented switch styled like the app's buttons/selects — one option active,
// a thumb that slides under the chosen one. Styles in scss/segmentedToggle.scss.
export default function SegmentedToggle<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: [K, string][];
  value: K;
  onChange: (value: K) => void;
  style?: React.CSSProperties;
}): JSX.Element {
  const index = Math.max(
    0,
    options.findIndex(([key]) => key === value)
  );
  return (
    <div className="segmented-toggle" style={style}>
      <div
        className="segmented-toggle-thumb"
        style={{
          width: `calc(${100 / options.length}% - 2px)`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map(([key, label]) => (
        <div
          key={key}
          onClick={() => onChange(key)}
          className={`segmented-toggle-option ${value === key ? "active" : ""}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
