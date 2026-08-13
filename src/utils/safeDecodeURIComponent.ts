/**
 * decodeURIComponent that survives malformed percent escapes — a hand-typed
 * public URL must show "not found", not crash the view.
 */
export default function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
