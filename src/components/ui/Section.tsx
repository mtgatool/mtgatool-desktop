import { CSSProperties } from "react";

import getCssQuality from "../../utils/getCssQuality";

export type SectionProps = React.PropsWithChildren<{
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
  showIf?: boolean;
}>;

export default function Section(props: SectionProps): JSX.Element {
  const { children, style, onClick, className, showIf } = props;

  if (showIf === false) return <></>;

  return (
    <div
      className={`section ${getCssQuality()} ${className || ""}`}
      style={{
        // display: "flex",
        // borderRadius: "3px",
        // backgroundColor: `var(--color-section)`,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
