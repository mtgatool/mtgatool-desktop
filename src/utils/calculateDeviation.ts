export default function calculateDeviation(values: number[]): number {
  return Math.sqrt(values.reduce((a, b) => a + b) / (values.length - 1));
}
