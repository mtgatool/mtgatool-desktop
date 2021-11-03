import { PropsWithChildren } from "react";

export interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  text: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
}

export default function Button(
  props: PropsWithChildren<ButtonProps>
): JSX.Element {
  const { disabled, style, onClick, className, text, children } = props;

  return (
    <div
      style={style || {}}
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
