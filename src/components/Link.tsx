import { CSSProperties } from "react";

import openExternal from "../utils/openExternal";

interface LinkProps {
  url: string;
  text?: string;
  style?: CSSProperties;
}

export default function Link(props: LinkProps) {
  const { style, text, url } = props;
  return (
    <a style={style} onClick={() => openExternal(url)}>
      {text || url}
    </a>
  );
}
