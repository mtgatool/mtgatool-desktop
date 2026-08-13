import Section from "./ui/Section";

/**
 * The one loading treatment for profile and shared pages: a section box with
 * the round MTGATool mark spinning (the auth screen's login treatment) and a
 * line saying what is loading, centered vertically in the content area — so
 * consecutive loading states (cards database, then data) look identical
 * instead of flickering between layouts.
 */
export default function PublicLoading({
  label,
}: {
  label?: string;
}): JSX.Element {
  return (
    <div
      className="public-loading"
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <Section
        style={{
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 96px",
        }}
      >
        <div className="public-loading-icon" aria-hidden="true" />
        {label ? <div className="public-loading-label">{label}</div> : null}
      </Section>
    </div>
  );
}
