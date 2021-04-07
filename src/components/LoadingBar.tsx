interface LoadingBarProps {
  style?: React.CSSProperties;
}

export default function LoadingBar({ style }: LoadingBarProps): JSX.Element {
  return (
    <>
      <div style={{ ...style }} className="loading-bar-main">
        <div className="loading-w loading-color" />
        <div className="loading-u loading-color" />
        <div className="loading-b loading-color" />
        <div className="loading-r loading-color" />
        <div className="loading-g loading-color" />
      </div>
    </>
  );
}
