export default function formatPercent(
  value: number,
  config = { maximumSignificantDigits: 2 }
): string {
  return value.toLocaleString([], {
    style: "percent",
    ...config,
  });
}
