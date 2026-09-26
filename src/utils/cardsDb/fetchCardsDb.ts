/* eslint-disable no-console */
/**
 * Get the SQLite card database, downloading it when there is a newer release.
 *
 * This is the SQLite counterpart of what database-wrapper used to do for the
 * JSON: check a tiny `latest.json`, and only move the ~17MB payload when the
 * published version is actually newer than the copy on disk.
 *
 * The cached file is named for the version it holds — `v231-en-database.sqlite`
 * — so "do we already have the newest?" is a file-existence check, with no
 * sidecar to keep in sync and no need to open the database to find out.
 */

import { kvGet, kvPut } from "../../data/localKV";

// `releases/latest/download/…` always resolves to the newest published release.
const RELEASE_BASE =
  "https://github.com/mtgatool/mtgatool-metadata/releases/latest/download";

// GitHub release assets send no Access-Control-Allow-Origin, so a browser
// cannot read them. The release CI mirrors the same files, gzipped, into a
// public Supabase Storage bucket that does send CORS headers.
const SUPABASE_METADATA_BASE =
  "https://decenyvqkbvydrrolwpk.supabase.co/storage/v1/object/public/metadata";

export interface LatestInfo {
  latest: number;
  updated: number;
  /**
   * Formats this release publishes. Absent on every release made before SQLite
   * existed, which is exactly what that absence should be read as.
   */
  formats?: string[];
}

export function releaseHasSqlite(latest: LatestInfo): boolean {
  return !!latest.formats && latest.formats.indexOf("sqlite") >= 0;
}

/** Every SQLite file starts with this, followed by a NUL. */
const SQLITE_HEADER = "SQLite format 3";

/**
 * Whether these bytes are actually a SQLite database.
 *
 * An HTTP 200 is not enough to know. A single-page host answers a request for
 * a file it does not have with index.html and a 200, so a missing database
 * arrives looking like a successful download and only fails later, deep in the
 * worker, as "file is not a database". Checking the header catches it at the
 * source — and catches a truncated or half-inflated payload with it.
 *
 * Node Buffers are Uint8Arrays, so this covers the desktop path too.
 */
export function isSqliteBytes(bytes: ArrayBuffer | Uint8Array): boolean {
  const head = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (head.length < SQLITE_HEADER.length) return false;
  for (let i = 0; i < SQLITE_HEADER.length; i += 1) {
    if (head[i] !== SQLITE_HEADER.charCodeAt(i)) return false;
  }
  return true;
}

/* --------------------------------------------------------------- electron */

/**
 * Fetch a release asset with Node's https.
 *
 * A renderer XHR to github.com is blocked by CORS; Node networking is not
 * subject to it. Follows the redirect chain to objects.githubusercontent.com
 * and inflates a gzipped response.
 */
function fetchReleaseBuffer(url: string): Promise<Buffer> {
  // eslint-disable-next-line no-undef
  const https = __non_webpack_require__("https");
  // eslint-disable-next-line no-undef
  const zlib = __non_webpack_require__("zlib");

  return new Promise<Buffer>((resolve, reject) => {
    const get = (u: string, redirects: number): void => {
      https
        .get(
          u,
          {
            headers: {
              "User-Agent": "mtgatool-desktop",
              "Accept-Encoding": "gzip",
            },
          },
          (res: any) => {
            const status = res.statusCode || 0;
            if (
              status >= 300 &&
              status < 400 &&
              res.headers.location &&
              redirects < 6
            ) {
              res.resume();
              get(res.headers.location, redirects + 1);
              return;
            }
            if (status !== 200) {
              res.resume();
              reject(new Error(`HTTP ${status} for ${u}`));
              return;
            }
            const stream =
              res.headers["content-encoding"] === "gzip"
                ? res.pipe(zlib.createGunzip())
                : res;
            const chunks: any[] = [];
            stream.on("data", (c: any) => chunks.push(c));
            stream.on("end", () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);
          }
        )
        .on("error", reject);
    };
    get(url, 0);
  });
}

export async function fetchLatestInfo(): Promise<LatestInfo | null> {
  try {
    const buf = await fetchReleaseBuffer(`${RELEASE_BASE}/latest.json`);
    return JSON.parse(buf.toString("utf8")) as LatestInfo;
  } catch (e) {
    console.log("[cards-db] could not read latest.json", e);
    return null;
  }
}

/** Cached databases on disk, newest version first. */
function cachedDatabases(fs: any, path: any, dir: string, lang: string) {
  const pattern = new RegExp(`^v(\\d+)-${lang}-database\\.sqlite$`);
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir);
  } catch (e) {
    return [];
  }
  return names
    .map((name: string) => {
      const m = pattern.exec(name);
      return m ? { name, version: parseInt(m[1], 10) } : null;
    })
    .filter((x: any): x is { name: string; version: number } => !!x)
    .sort((a: any, b: any) => b.version - a.version)
    .map((x: any) => ({ ...x, full: path.join(dir, x.name) }));
}

/**
 * Ensure the newest published database is on disk, and return its path.
 *
 * Returns whatever is already cached when the network is unavailable — being
 * a version behind is far better than having no cards.
 */
export async function ensureDatabaseFile(
  userDataDir: string,
  lang: string
): Promise<string | null> {
  // eslint-disable-next-line no-undef
  const fs = __non_webpack_require__("fs");
  // eslint-disable-next-line no-undef
  const path = __non_webpack_require__("path");

  const cached = cachedDatabases(fs, path, userDataDir, lang);
  const newest = cached.length ? cached[0] : null;

  const latest = await fetchLatestInfo();

  if (!latest) return newest ? newest.full : null;

  if (!releaseHasSqlite(latest)) {
    console.log(
      `[cards-db] release v${latest.latest} publishes no SQLite database.`
    );
    return newest ? newest.full : null;
  }

  if (newest && newest.version >= latest.latest) {
    console.log(`[cards-db] database up to date (v${newest.version})`);
    return newest.full;
  }

  const target = path.join(
    userDataDir,
    `v${latest.latest}-${lang}-database.sqlite`
  );
  const tmp = `${target}.part`;

  try {
    console.log(`[cards-db] downloading v${latest.latest} ${lang} database …`);
    const buf = await fetchReleaseBuffer(
      `${RELEASE_BASE}/${lang}-database.sqlite`
    );
    // Checked before it is written, not after: the cache is keyed by version,
    // so writing a bad payload would name it as the newest good copy and every
    // later run would skip the download and load the same broken file.
    if (!isSqliteBytes(buf)) {
      throw new Error("downloaded file is not a SQLite database");
    }
    // Write then rename, so an interrupted download never leaves a truncated
    // file behind under a name that says it is complete.
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, target);
    console.log(
      `[cards-db] saved ${target} (${(buf.length / 1048576).toFixed(1)} MB)`
    );

    cached.forEach((old: any) => {
      if (old.full !== target) {
        try {
          fs.unlinkSync(old.full);
        } catch (e) {
          /* leaving a stale file behind is harmless */
        }
      }
    });

    return target;
  } catch (e) {
    console.log("[cards-db] download failed", e);
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch (err) {
      /* ignore */
    }
    return newest ? newest.full : null;
  }
}

/* -------------------------------------------------------------------- web */

function gunzipToArrayBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const DS = (window as any).DecompressionStream;
  const stream = new Response(buffer).body?.pipeThrough(new DS("gzip"));
  return new Response(stream).arrayBuffer();
}

/** What the web keeps in IndexedDB: the inflated database, named by version. */
interface CachedWebDb {
  version: number;
  bytes: ArrayBuffer;
}

const webCacheKey = (lang: string): string => `cardsDb:${lang}`;

/** Best-effort reads/writes: a broken IndexedDB must never block the cards. */
async function readWebCache(lang: string): Promise<CachedWebDb | null> {
  try {
    const cached = await kvGet<CachedWebDb>(webCacheKey(lang));
    if (cached && isSqliteBytes(cached.bytes)) return cached;
  } catch (e) {
    /* fall through to the network */
  }
  return null;
}

async function writeWebCache(lang: string, entry: CachedWebDb): Promise<void> {
  try {
    await kvPut(webCacheKey(lang), entry);
  } catch (e) {
    console.log("[cards-db] could not cache the database locally", e);
  }
}

export interface WebDatabase {
  bytes: ArrayBuffer;
  /** Where the bytes came from, for the log/source label. */
  source: string;
}

/**
 * The web counterpart of `ensureDatabaseFile`: the ~5MB payload only moves
 * when `latest.json` names a version newer than the copy cached in IndexedDB —
 * the same tiny-check-first flow the desktop uses against its disk cache.
 * Unlike the browser's HTTP cache (the mirror answers Cache-Control:
 * no-cache), the IndexedDB copy needs no revalidation round-trip.
 *
 * The mirror is read gzipped — ~17MB becomes ~5MB on the wire, and unlike the
 * GitHub assets it is CORS-readable. The cache keeps the inflated bytes.
 */
export async function fetchDatabaseWeb(
  lang: string
): Promise<WebDatabase | null> {
  const cached = await readWebCache(lang);

  let latest: LatestInfo | null = null;
  try {
    const latestRes = await fetch(`${SUPABASE_METADATA_BASE}/latest.json`);
    if (latestRes.ok) latest = (await latestRes.json()) as LatestInfo;
  } catch (e) {
    /* handled below: unreadable latest.json is not fatal */
  }

  if (latest) {
    if (!releaseHasSqlite(latest)) {
      console.log(
        `[cards-db] release v${latest.latest} publishes no SQLite database.`
      );
      return cached
        ? { bytes: cached.bytes, source: `cache:v${cached.version}` }
        : null;
    }
    if (cached && cached.version >= latest.latest) {
      console.log(
        `[cards-db] database up to date (v${cached.version}), using cached copy`
      );
      return { bytes: cached.bytes, source: `cache:v${cached.version}` };
    }
  } else if (cached) {
    // Being a version behind is far better than having no cards — and if
    // latest.json is unreachable, the payload on the same host likely is too.
    console.log("[cards-db] could not read latest.json, using cached copy");
    return { bytes: cached.bytes, source: `cache:v${cached.version}` };
  }

  try {
    console.log(
      `[cards-db] downloading ${
        latest ? `v${latest.latest} ` : ""
      }${lang} database …`
    );
    const res = await fetch(
      `${SUPABASE_METADATA_BASE}/${lang}-database.sqlite.gz`
    );
    if (!res.ok) {
      console.log(`[cards-db] mirror returned HTTP ${res.status}`);
      return cached
        ? { bytes: cached.bytes, source: `cache:v${cached.version}` }
        : null;
    }
    const bytes = await gunzipToArrayBuffer(await res.arrayBuffer());
    if (!isSqliteBytes(bytes)) {
      console.log("[cards-db] mirror did not return a SQLite database");
      return cached
        ? { bytes: cached.bytes, source: `cache:v${cached.version}` }
        : null;
    }
    // Version 0 when latest.json was unreadable: never mistaken for newest,
    // so the next run with a readable latest.json re-checks properly.
    const version = latest ? latest.latest : 0;
    await writeWebCache(lang, { version, bytes });
    return { bytes, source: `mirror:v${version || "?"}` };
  } catch (e) {
    console.log("[cards-db] web database fetch failed", e);
    return cached
      ? { bytes: cached.bytes, source: `cache:v${cached.version}` }
      : null;
  }
}
