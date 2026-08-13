/**
 * Loading state with the round MTGATool mark spinning, same as the auth
 * screen while logging in. Full-page by default (the standalone public
 * shells); `inline` sits in the content flow instead, for loading sections
 * inside the app.
 */
export default function PublicLoading({
  label,
  inline,
}: {
  label?: string;
  inline?: boolean;
}): JSX.Element {
  return (
    <div className={`public-loading${inline ? " inline" : ""}`}>
      <div className="public-loading-icon" />
      {label ? <div className="public-loading-label">{label}</div> : null}
    </div>
  );
}
