import { CSSProperties } from "react";

export type SectionProps = React.PropsWithChildren<{ style?: CSSProperties }>;

export default function Section(props: SectionProps): JSX.Element {
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
