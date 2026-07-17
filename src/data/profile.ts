/**
 * User profile / avatar storage in Supabase.
 *
 * One avatar per LOGIN (auth user): the image is uploaded to the public
 * `avatars` Storage bucket at object name = the user's uid, and the resulting
 * public URL is recorded on the user's `profiles` row (public-read, so future
 * explore/showcase features can list users + avatars). Best-effort; never
 * throws.
 */
import supabase, { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./supabase";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Upload a resized avatar data URI to Supabase and record it on the profile.
 * Returns the (cache-busted) public URL, or null on failure.
 */
export async function uploadAvatar(dataUri: string): Promise<string | null> {
  try {
    const uid = await currentUserId();
    if (!uid) return null;

    // Attach the user JWT explicitly. supabase-js 2.39.x on the web build does
    // not reliably propagate the session to its Storage client, so the SDK
    // upload goes out as anon and RLS 403s ("violates row-level security"). A
    // direct authenticated request avoids that.
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return null;

    const blob = await (await fetch(dataUri)).blob();
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/avatars/${uid}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": blob.type || "image/png",
          "x-upsert": "true",
        },
        body: blob,
      }
    );
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn("[avatar] upload failed:", res.status, await res.text());
      return null;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(uid);
    // The object name is stable (the uid), so bust CDN/browser caches on change.
    const url = `${pub.publicUrl}?u=${new Date().getTime()}`;

    const { error: pErr } = await supabase.from("profiles").upsert({
      id: uid,
      avatar_url: url,
      updated_at: new Date().toISOString(),
    });
    if (pErr) {
      // eslint-disable-next-line no-console
      console.warn("[avatar] profile upsert failed:", pErr.message);
    }
    return url;
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
