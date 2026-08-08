/**
 * Supporter tier badge: a rounded hexagon shield with a lotus centred on it,
 * drawn tone-on-tone in the tier's dark mark colour, with one star pip per tier
 * above Casual arced over the flower, in the same tone as the lotus.
 *
 * Two signals carry the tier — the metal (bronze, silver, gold, emerald with a
 * black lotus) and the star count (0..3) — so the badge is readable at the
 * nav's 22px and stays readable without colour.
 *
 * The lotus is the mark from lotus-svgrepo-com.svg (512 viewBox), scaled into
 * the shield; the two degenerate zero-area paths in the source were dropped.
 *
 * Self-contained: the gradient and all geometry live in the SVG, so the element
 * needs no background from CSS. Gradient ids are per-tier, not per-instance;
 * two badges of the same tier duplicate an id, which browsers resolve to the
 * first — identical content, so rendering is unaffected.
 *
 * Iterated visually in public/badge-lab/index.html — keep the two in sync.
 */

export const TIERS: Record<
  number,
  { top: string; bottom: string; mark: string }
> = {
  1: { top: "#cf9257", bottom: "#aa6c38", mark: "#87551f" },
  2: { top: "#ccd3d9", bottom: "#a9b2ba", mark: "#73818c" },
  3: { top: "#f5c84f", bottom: "#edaf2d", mark: "#d07c15" },
  4: { top: "#3fce8f", bottom: "#1f9d67", mark: "#0e1a14" },
};

/** Star pip positions per tier, arced over the lotus. */
const PIPS: Record<number, [number, number][]> = {
  1: [],
  2: [[12, 7.1]],
  3: [
    [9.9, 7.1],
    [14.1, 7.1],
  ],
  4: [
    [7.9, 7.7],
    [12, 6.3],
    [16.1, 7.7],
  ],
};

const BORDER = "#33373d";
/** Pointy-top hexagon; the round stroke join is what rounds the corners. */
const HEX = "M12 2.6 L20.4 7.3 V16.7 L12 21.4 L3.6 16.7 V7.3 Z";
/** A small five-point star, centred on the origin. */
const PIP =
  "M0.00 -1.45 L0.36 -0.50 L1.38 -0.45 L0.59 0.19 L0.85 1.17 L0.00 0.62 L-0.85 1.17 L-0.59 0.19 L-1.38 -0.45 L-0.36 -0.50 Z";

export default function SupporterTierIcon({
  tier,
}: {
  tier: number;
}): JSX.Element | null {
  const t = TIERS[tier];
  if (!t) return null;

  const gid = `supporter-badge-g${tier}`;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.top} />
          <stop offset="1" stopColor={t.bottom} />
        </linearGradient>
      </defs>
      <path
        d={HEX}
        fill={BORDER}
        stroke={BORDER}
        strokeWidth={3.4}
        strokeLinejoin="round"
      />
      {/* Fill only: a gradient stroke here would paint over the border ring. */}
      <path d={HEX} fill={`url(#${gid})`} />
      <g transform="translate(6.25 6.75) scale(0.02246)" fill={t.mark}>
        <path d="M256,94.349c0,0-67.301,57.307-67.301,128s67.301,128,67.301,128s67.301-57.307,67.301-128S256,94.349,256,94.349z" />
        <path d="M195.334,332.483c-11.322-15.587-20.403-31.598-26.991-47.59c-8.648-20.99-13.034-42.033-13.034-62.543c0-13.635,1.95-27.504,5.789-41.438c-43.015-15.027-86.116-11.581-86.116-11.581s-7.067,88.111,42.921,138.099c25.49,25.49,60.889,36.139,89.466,40.461C203.482,343.253,199.414,338.101,195.334,332.483z" />
        <path d="M178.096,376.052c-34.412-8.672-62.609-23.815-83.806-45.013c-9.641-9.641-18.07-20.827-25.207-33.395C28.041,317.434,0,350.349,0,350.349s57.307,67.301,128,67.301c36.05,0,68.614-17.501,91.877-34.656C207.406,381.904,193.082,379.828,178.096,376.052z" />
        <path d="M437.019,169.331c0,0-43.102-3.446-86.116,11.581c3.839,13.933,5.789,27.803,5.789,41.438c0,20.51-4.385,41.553-13.034,62.543c-6.588,15.992-15.669,32.003-26.991,47.59c-4.08,5.619-8.149,10.77-12.035,15.408c28.577-4.322,63.977-14.972,89.466-40.461C444.085,257.441,437.019,169.331,437.019,169.331z" />
        <path d="M442.917,297.645c-7.137,12.567-15.566,23.753-25.207,33.395c-21.197,21.198-49.394,36.341-83.806,45.013c-14.986,3.777-29.31,5.852-41.781,6.943c23.264,17.154,55.827,34.656,91.877,34.656c70.693,0,128-67.301,128-67.301S483.959,317.434,442.917,297.645z" />
      </g>
      {PIPS[tier].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={PIP}
          transform={`translate(${x} ${y})`}
          fill={t.mark}
        />
      ))}
    </svg>
  );
}
