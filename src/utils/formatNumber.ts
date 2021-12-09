export default function formatNumber(value: number, config = {}): string {
  return value.toLocaleString([], {
    style: "decimal",
    ...config,
  });
}
