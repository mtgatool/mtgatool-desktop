import { isSqliteBytes } from "../cardsDb/fetchCardsDb";

const bytesOf = (s: string): Uint8Array =>
  Uint8Array.from(s.split("").map((c) => c.charCodeAt(0)));

// The case this exists for: a single-page host answers a request for a file it
// does not have with index.html and a 200, so a missing database arrives
// looking like a successful download.
const SPA_FALLBACK = '<!doctype html><html lang="en"><head><meta charset';

describe("isSqliteBytes", () => {
  it("accepts a real SQLite header", () => {
    expect(isSqliteBytes(bytesOf("SQLite format 3\0\r\n more bytes"))).toBe(
      true
    );
  });

  it("rejects an HTML page served in place of the database", () => {
    expect(isSqliteBytes(bytesOf(SPA_FALLBACK))).toBe(false);
  });

  it("rejects an empty or truncated response", () => {
    expect(isSqliteBytes(new Uint8Array(0))).toBe(false);
    expect(isSqliteBytes(bytesOf("SQLite"))).toBe(false);
  });

  it("reads an ArrayBuffer as well as a view", () => {
    const view = bytesOf("SQLite format 3\0padding");
    expect(isSqliteBytes(view.buffer as ArrayBuffer)).toBe(true);
  });
});
