/**
 * Custom app-background persistence.
 *
 * The background is saved to the local KV under a single device-global key (not
 * user-namespaced) so it can be restored on boot *before* login — no waiting on
 * the network to see your background. The full object (including the inlined
 * data: URI) lives locally.
 *
 * The cloud only stores a compact descriptor (metadata + the original image
 * URL, no multi-MB data URI) on the user's profile, so the choice follows the
 * account across devices. On login we re-materialize the image from that URL
 * via the random-art edge function — see hydrateFromCloud.
 */
import { CustomBackground } from "../redux/slices/rendererSlice";
import { getData, putData } from "./store";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

/** Device-global key (not tied to a login), readable before auth. */
const LOCAL_BG_KEY = "customBackground";
/** Remembered "Art source" URL scoping the shuffle (device-global). */
const ART_SOURCE_KEY = "artSource";

export function loadArtSource(): Promise<string | null> {
  return getData<string>(ART_SOURCE_KEY, false);
}

export function saveArtSource(url: string): Promise<boolean> {
  return putData(ART_SOURCE_KEY, url, false);
}

export function loadLocalBackground(): Promise<CustomBackground | null> {
  return getData<CustomBackground>(LOCAL_BG_KEY, false);
}

export function saveLocalBackground(
  bg: CustomBackground | null
): Promise<boolean> {
  return putData(LOCAL_BG_KEY, bg, false);
}

/** The compact, cloud-syncable form of an artofmtg background (no data URI). */
export interface BackgroundDescriptor {
  source: "artofmtg";
  imageUrl: string;
  page?: string;
  title?: string;
  artist?: string;
  set?: string;
}

/**
 * Reduce a background to the descriptor we sync to the cloud. Only artofmtg
 * picks sync (they can be re-materialized anywhere); local-file backgrounds
 * stay on the device, so they yield null.
 */
export function toDescriptor(
  bg: CustomBackground | null
): BackgroundDescriptor | null {
  if (!bg || bg.source !== "artofmtg" || !bg.imageUrl) return null;
  return {
    source: "artofmtg",
    imageUrl: bg.imageUrl,
    page: bg.page,
    title: bg.title,
    artist: bg.artist,
    set: bg.set,
  };
}

/**
 * Turn a cloud descriptor back into a full CustomBackground by re-fetching the
 * image (data URI) through the edge function. Returns null on any failure.
 */
export async function materialize(
  desc: BackgroundDescriptor
): Promise<CustomBackground | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/random-art?img=${encodeURIComponent(
        desc.imageUrl
      )}`,
      { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.url) return null;
    return {
      url: data.url,
      source: "artofmtg",
      imageUrl: desc.imageUrl,
      page: desc.page,
      title: desc.title,
      artist: desc.artist,
      set: desc.set,
    };
  } catch {
    return null;
  }
}
