import { CSSProperties, useCallback, useEffect, useState } from "react";

interface SelectProps<K> {
  optionFormatter?: (option: K | string) => string | JSX.Element;
  current: K;
  callback: (option: K) => void;
  options: K[];
  className?: string;
  style?: CSSProperties;
}

export default function Select<K>({
  optionFormatter,
  current,
  callback,
  options,
  className,
  style,
}: SelectProps<K>): JSX.Element {
  const formatterFunc =
    typeof optionFormatter === "function"
      ? optionFormatter
      : (inString: string | K): string | K => inString;

  const [currentOption, setCurrentOption] = useState<K>(current);
  const [optionsOpen, setOptionsOpen] = useState(false);
  useEffect(() => setCurrentOption(current), [current]);

  const onClickSelect = useCallback(() => {
    setOptionsOpen(!optionsOpen);
  }, [optionsOpen]);

  const onClickOption = useCallback(
    (event) => {
      setCurrentOption(options[event.currentTarget.value]);
      setOptionsOpen(false);
      if (callback) callback(options[event.currentTarget.value]);
    },
    [callback, options]
  );

  const buttonClassNames = `select-button ${className} ${
    optionsOpen ? "active" : ""
  }`;

  return (
    <div className={`select-container ${className}`} style={style}>
      <button
        type="button"
        key={`${currentOption}-key`}
        className={buttonClassNames}
        onClick={onClickSelect}
      >
        {formatterFunc(currentOption)}
      </button>
      {optionsOpen && (
        <div className={`select-options-container ${className}`}>
          {options.map((option, i) => {
            return typeof option === "string" && option.startsWith("%%") ? (
              <div className={`select-title ${className}`} key={option}>
                {option.replace("%%", "")}
              </div>
            ) : (
              <button
                type="button"
                className={`select-option ${className} ${
                  option === currentOption ? "disabled" : ""
                }`}
                key={`${option}--option-key`}
                value={i}
                disabled={option === currentOption}
                onClick={onClickOption}
              >
                {formatterFunc(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
