import { PropsWithChildren } from "react";

export default function MetricText(props: PropsWithChildren<any>) {
  const { children } = props;

  return (
    <div
      style={{
        display: "flex",
        lineHeight: "32px",
        color: "var(--color-text)",
        fontWeight: 300,
      }}
    >
      {children}
    </div>
  );
}
