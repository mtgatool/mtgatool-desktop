import { PropsWithChildren } from "react";

interface CheckboxContainerProps {
  className?: string;
}

export default function CheckboxContainer(
  props: PropsWithChildren<CheckboxContainerProps>
) {
  const { className, children } = props;

  return (
    <label
      style={{ cursor: "pointer", display: "inline-flex" }}
      className={`${className || ""} check-container`}
    >
      {children}
    </label>
  );
}
