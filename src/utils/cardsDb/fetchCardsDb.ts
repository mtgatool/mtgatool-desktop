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

/**
 * The web build reads the gzipped mirror — ~17MB becomes ~5MB on the wire, and
 * unlike the GitHub assets it is CORS-readable.
 */
export async function fetchDatabaseWeb(
  lang: string
): Promise<ArrayBuffer | null> {
  try {
    const latestRes = await fetch(`${SUPABASE_METADATA_BASE}/latest.json`);
    if (latestRes.ok) {
      const latest = (await latestRes.json()) as LatestInfo;
      if (!releaseHasSqlite(latest)) {
        console.log(
          `[cards-db] release v${latest.latest} publishes no SQLite database.`
        );
        return null;
      }
    }

    const res = await fetch(
      `${SUPABASE_METADATA_BASE}/${lang}-database.sqlite.gz`
    );
    if (!res.ok) {
      console.log(`[cards-db] mirror returned HTTP ${res.status}`);
      return null;
    }
    return await gunzipToArrayBuffer(await res.arrayBuffer());
  } catch (e) {
    console.log("[cards-db] web database fetch failed", e);
    return null;
  }
}
