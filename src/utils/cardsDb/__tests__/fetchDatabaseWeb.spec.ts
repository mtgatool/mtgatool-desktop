/**
 * The web database cache: the ~5MB payload must only move when latest.json
 * names a version newer than the IndexedDB copy. These tests cover the
 * decision paths that need no gunzip (jsdom has no DecompressionStream): a
 * fresh cache skips the download entirely, an unreachable latest.json falls
 * back to the cache, and a missing cache with no network yields null.
 */
import { fetchDatabaseWeb } from "../fetchCardsDb";

jest.mock("../../../data/localKV", () => ({
  kvGet: jest.fn(),
  kvPut: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { kvGet, kvPut } = require("../../../data/localKV");

/** A buffer starting with the SQLite magic header. */
function sqliteBytes(): ArrayBuffer {
  const header = "SQLite format 3";
  const bytes = new Uint8Array(32);
  for (let i = 0; i < header.length; i += 1) bytes[i] = header.charCodeAt(i);
  return bytes.buffer;
}

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.clearAllMocks();
});

function mockFetch(
  handler: (url: string) => Partial<Response> | null
): jest.Mock {
  const mock = jest.fn(async (url: string) => {
    const res = handler(url);
    if (!res) throw new Error(`network unavailable for ${url}`);
    return res as Response;
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe("fetchDatabaseWeb caching", () => {
  it("serves the cached copy without downloading when up to date", async () => {
    kvGet.mockResolvedValue({ version: 231, bytes: sqliteBytes() });
    const fetchMock = mockFetch((url) =>
      url.endsWith("latest.json")
        ? ({
            ok: true,
            json: async () => ({
              latest: 231,
              updated: 0,
              formats: ["sqlite"],
            }),
          } as Partial<Response>)
        : null
    );

    const db = await fetchDatabaseWeb("en");

    expect(db?.source).toBe("cache:v231");
    // Only the tiny latest.json moved; the payload was never requested.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("latest.json");
    expect(kvPut).not.toHaveBeenCalled();
  });

  it("falls back to the cached copy when latest.json is unreachable", async () => {
    kvGet.mockResolvedValue({ version: 230, bytes: sqliteBytes() });
    const fetchMock = mockFetch(() => null);

    const db = await fetchDatabaseWeb("en");

    expect(db?.source).toBe("cache:v230");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null with no cache and no network", async () => {
    kvGet.mockResolvedValue(null);
    mockFetch(() => null);

    expect(await fetchDatabaseWeb("en")).toBeNull();
  });

  it("ignores a cached entry that is not a SQLite file", async () => {
    // A corrupt cache must read as "no cache", not get served.
    kvGet.mockResolvedValue({ version: 231, bytes: new ArrayBuffer(32) });
    mockFetch(() => null);

    expect(await fetchDatabaseWeb("en")).toBeNull();
  });
});
