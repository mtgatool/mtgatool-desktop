/* eslint-disable react/jsx-props-no-spreading */
import { PropsWithChildren } from "react";

export default function Flex(props: PropsWithChildren<any>): JSX.Element {
  const { style, children } = props;
  return (
    <div {...props} style={{ ...style, display: "flex" }}>
      {children}
    </div>
  );
}
