export type StatusState = "ok" | "warn" | "err";

interface StatusPillProps {
  state: StatusState;
  /**
   * What the state *is*, in a word or two.
   *
   * Not optional on purpose. The dot on its own asked the reader to remember
   * which colour meant what, and to be able to tell three of them apart at 8px
   * — the label is what makes the state legible, and the colour only reinforces
   * something already written down.
   */
  label: string;
  title?: string;
}

export default function StatusPill({
  state,
  label,
  title,
}: StatusPillProps): JSX.Element {
  return (
    <div className={`status-pill ${state}`} title={title}>
      <span className="status-pill-dot" />
      {label}
    </div>
  );
}
