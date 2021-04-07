interface IconButtonProps {
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
  icon: string;
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function IconButton(props: IconButtonProps): JSX.Element {
  const { onClick, style, title, disabled, icon } = props;
  return (
    <div
      title={title}
      className="icon-button"
      onClick={disabled ? undefined : onClick}
      style={{
        ...style,
        opacity: disabled ? 0.5 : 1,
        backgroundImage: `url("${icon}"`,
      }}
    />
  );
}
