/**
 * Full-page loading state for the public pages: the round MTGATool mark
 * spinning, same as the auth screen while logging in — instead of a bare
 * "Loading…" line floating on the page background.
 */
export default function PublicLoading({
  label,
}: {
  label?: string;
}): JSX.Element {
  return (
    <div className="public-loading">
      <div className="public-loading-icon" />
      {label ? <div className="public-loading-label">{label}</div> : null}
    </div>
  );
}
