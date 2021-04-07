import { ChangeEvent, useCallback, useEffect, useState } from "react";

interface ToggleProps {
  text: string | JSX.Element;
  containerClassName?: string;
  value: boolean;
  callback: (value: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  margin?: boolean;
}

export default function Toggle(props: ToggleProps): JSX.Element {
  const {
    disabled,
    value,
    callback,
    style,
    containerClassName,
    text,
    margin,
  } = props;
  const [currentValue, setCurrentValue] = useState(value);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      if (!disabled) {
        const newValue = event.target.checked;
        callback(newValue);
        setCurrentValue(newValue);
      }
    },
    [callback, disabled]
  );

  const disabledStyle = disabled
    ? {
        cursor: "default",
        color: "var(--color-text-disabled)",
      }
    : {};

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <label
      style={style}
      className={`${containerClassName ?? "switch-container"} ${
        margin === true || margin === undefined ? "switch-container-margin" : ""
      }`}
    >
      <div style={disabledStyle} className="switch-label">
        {text}
      </div>
      <div className="switch">
        <input type="checkbox" checked={currentValue} onChange={onChange} />
        <span style={disabledStyle} className="switchslider" />
      </div>
    </label>
  );
}
