import { CSSProperties } from "react";

/**
 * Patreon mark: the stem and the bowl of the "P".
 *
 * Ported verbatim from the website's `components/svg/PatreonLogo.tsx` so the two
 * front doors look the same. Both paths inherit `currentColor`, so colour and
 * hover live in CSS rather than here.
 */
export default function PatreonLogo(props: {
  style?: CSSProperties;
  className?: string;
}): JSX.Element {
  const { style, className } = props;

  return (
    <svg
      viewBox="0 0 201 193"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M128.368 144.099C168.084 144.099 200.281 111.903 200.281 72.1873C200.281 32.4713 168.084 0.275146 128.368 0.275146C88.6524 0.275146 56.4563 32.4713 56.4563 72.1873C56.4563 111.903 88.6524 144.099 128.368 144.099Z"
        fill="currentColor"
      />
      <path
        d="M36.0695 0.275146H0.920166V192.12H36.0695V0.275146Z"
        fill="currentColor"
      />
    </svg>
  );
}
