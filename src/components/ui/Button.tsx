import { PropsWithChildren } from "react";

export interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  text: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  /** Hover text. Some buttons do something worth explaining before it happens. */
  title?: string;
}

export default function Button(
  props: PropsWithChildren<ButtonProps>
): JSX.Element {
  const { disabled, style, onClick, className, text, children, title } = props;

  return (
    <div
      style={style || {}}
      title={title}
      onClick={disabled == true ? undefined : onClick}
      className={
        disabled == true
          ? "button-simple-disabled"
          : className ?? "button-simple"
      }
    >
      {children || text}
    </div>
  );
}
