import { CSSProperties } from "react";

export default function Section(
  props: React.PropsWithChildren<{ style?: CSSProperties }>
): JSX.Element {
  const { children, style } = props;

  return (
    <div
      style={{
        ...style,
        display: "flex",
        borderRadius: "2px",
        backgroundColor: `var(--color-section)`,
      }}
    >
      {children}
    </div>
  );
}
