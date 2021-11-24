import { CSSProperties } from "react";

export type SectionProps = React.PropsWithChildren<{
  style?: CSSProperties;
  onClick?: () => void;
}>;

export default function Section(props: SectionProps): JSX.Element {
  const { children, style, onClick } = props;

  return (
    <div
      style={{
        display: "flex",
        borderRadius: "3px",
        backgroundColor: `var(--color-section)`,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
