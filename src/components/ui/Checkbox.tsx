import { useEffect, useState } from "react";

interface CheckboxProps {
  text: string | JSX.Element;
  value: boolean;
  callback: (value: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function Checkbox(props: CheckboxProps): JSX.Element {
  const { disabled, value, text, callback, style } = props;
  const [currentValue, setCurrentValue] = useState(value);

  const click = (): void => {
    if (!disabled) {
      callback(!currentValue);
      setCurrentValue(!currentValue);
    }
  };

  const disabledLabelStyle = {
    ...style,
    cursor: "default",
    opacity: 0.4,
  };

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  return (
    <label
      style={disabled ? disabledLabelStyle : { ...style }}
      onClick={click}
      className={`check-container ${disabled ? "" : "hover-label"}`}
    >
      {text}
      <input type="checkbox" checked={currentValue} disabled />
      <span className="checkmark" />
    </label>
  );
}
