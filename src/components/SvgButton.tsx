interface SvgButtonProps {
  style?: React.CSSProperties;
  title?: string;
  svg: React.StatelessComponent<React.SVGAttributes<SVGElement>>;
  element?: JSX.Element;
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function SvgButton(props: SvgButtonProps): JSX.Element {
  const { onClick, style, title, svg, element } = props;
  const Svg = svg;
  return (
    <div
      title={title}
      className="svg-button"
      onClick={onClick}
      style={{ ...style }}
    >
      {element || <Svg fill="var(--color-icon)" />}
    </div>
  );
}
