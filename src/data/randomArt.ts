import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

export interface RandomArt {
  /**
   * The image itself, inlined as a `data:` URI. artofmtg blocks cross-origin
   * hotlinking (Cloudflare 403s on foreign Referer), so the edge function
   * fetches the bytes server-side and embeds them — the browser never requests
   * artofmtg directly.
   */
  url: string;
  /** Card / art title, e.g. "Thoughtseize". */
  title: string;
  /** Artist name, e.g. "Aleksi Briclot" (may be empty). */
  artist: string;
  /** Set the art is from, e.g. "Theros". */
  set: string;
  /** The artofmtg.com art page the piece came from. */
  page: string;
  /** The original remote image URL (for reference; not directly loadable). */
  imageUrl: string;
}

/**
 * Grabs a random Magic art piece from artofmtg.com via the `random-art` Supabase
 * edge function. The scraping happens server-side, so this works identically on
 * web and Electron (no CORS, no HTML parsing on the client).
 *
 * Returns null on any failure — callers should just keep the current background.
 */
/**
 * @param source Optional artofmtg URL scoping the pick: an `/art/…` page returns
 *   that exact piece; a set/artist/gallery page returns a random art from it;
 *   omitted picks randomly across all sets.
 */
export default async function fetchRandomArt(
  source?: string
): Promise<RandomArt | null> {
  try {
    const qs = source ? `?source=${encodeURIComponent(source)}` : "";
    const res = await fetch(`${SUPABASE_URL}/functions/v1/random-art${qs}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.url) return null;
    return data as RandomArt;
  } catch {
    return null;
  }
}
