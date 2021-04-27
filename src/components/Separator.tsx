interface SeparatorProps {
  children: React.ReactNode;
}

export default function Separator(props: SeparatorProps): JSX.Element {
  const { children } = props;
  return <div className="card-tile-separator">{children}</div>;
}
