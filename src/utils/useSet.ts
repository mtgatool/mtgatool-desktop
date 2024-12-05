export default function useSet<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}
