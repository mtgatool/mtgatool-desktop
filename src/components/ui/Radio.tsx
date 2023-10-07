import { useEffect, useState } from "react";

export interface RadioProps {
  text: string | JSX.Element;
  value: boolean;
  callback: (value: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

export default function Radio(props: RadioProps): JSX.Element {
  const { disabled, value, text, callback, style, containerStyle } = props;
  const [currentValue, setCurrentValue] = useState(value);

  const click = (): void => {
    if (!disabled && currentValue === false) {
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
    <div className="radio-container" style={containerStyle}>
      <input type="radio" checked={currentValue} disabled />
      <label
        style={disabled ? disabledLabelStyle : { ...style }}
        onClick={click}
        className={`${disabled ? "" : "hover-label"}`}
      >
        {text}
        <span className="radiospan" />
      </label>
    </div>
  );
}
