export interface IconButtonProps {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
  icon: string;
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function IconButton(props: IconButtonProps): JSX.Element {
  const { onClick, style, title, disabled, icon, className } = props;
  return (
    <div
      title={title}
      className={`icon-button ${className || ""}`}
      onClick={disabled ? undefined : onClick}
      style={{
        ...style,
        opacity: disabled ? 0.5 : 1,
        backgroundImage: `url("${icon}")`,
      }}
    />
  );
}
