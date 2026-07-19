/**
 * User profile / avatar storage in Supabase.
 *
 * One avatar per LOGIN (auth user), stored as a small resized data URI directly
 * on the public `profiles.avatar_url` column (public-read, so future
 * explore/showcase features can list users + avatars). We go through PostgREST
 * rather than Storage because the Storage service on this project doesn't
 * recognise the (asymmetric ES256) user JWT — it 403s every authenticated write
 * — whereas PostgREST verifies it fine. Avatars are 128x128 (~a few KB), so a
 * data URI in a text column is acceptable. Best-effort; never throws.
 */
import { BackgroundDescriptor } from "./backgroundStore";
import { Json } from "./database.types";
import supabase from "./supabase";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Store a resized avatar data URI on the user's profile. Returns the stored
 * value (the data URI) or null on failure.
 */
export async function uploadAvatar(dataUri: string): Promise<string | null> {
  try {
    const uid = await currentUserId();
    if (!uid) return null;

    const { error } = await supabase.from("profiles").upsert({
      id: uid,
      avatar_url: dataUri,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[avatar] profile upsert failed:", error.message);
      return null;
    }
    return dataUri;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[avatar] uploadAvatar threw:", e);
    return null;
  }
}

/**
 * Update the login's display name on its public profile. profiles.username is
 * populated at signup by a DB trigger and is UNIQUE, so a name already taken by
 * another user is rejected (returns false); the caller keeps its local rename.
 */
export async function updateUsername(username: string): Promise<boolean> {
  try {
    const uid = await currentUserId();
    if (!uid) return false;
    const { error } = await supabase.from("profiles").upsert({
      id: uid,
      username,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[profile] username update failed:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the login's private-mode flag on its profile, so the public feed /
 * lookups (get_latest_ranks / get_public_profiles) can exclude it.
 */
export async function setProfilePrivate(isPrivate: boolean): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("profiles").upsert({
      id: uid,
      is_private: isPrivate,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[profile] setProfilePrivate failed:", e);
  }
}

/**
 * Persist (or clear) the login's custom background on its profile. We store a
 * compact descriptor (metadata + original image URL, no data URI) so the choice
 * follows the account across devices; the client re-materializes the image on
 * login. Best-effort; never throws.
 */
export async function setProfileBackground(
  descriptor: BackgroundDescriptor | null
): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("profiles").upsert({
      id: uid,
      background: descriptor as unknown as Json,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[profile] setProfileBackground failed:", e);
  }
}

/** The current login's avatar URL from its profile row, or null. */
export async function fetchOwnAvatarUrl(): Promise<string | null> {
  try {
    const uid = await currentUserId();
    if (!uid) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[avatar] fetch failed:", error.message);
      return null;
    }
    return (data?.avatar_url as string) ?? null;
  } catch {
    return null;
  }
}
