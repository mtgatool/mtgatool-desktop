/**
 * Username/password auth on Supabase, replacing the old ECDSA-keypair
 * identity. Supabase auth is email-based, so usernames map to a synthetic
 * address on a domain we control; no real email is collected. The only
 * profile data stored is the public username (see the `profiles` table).
 */

import setLocalSetting from "../utils/setLocalSetting";
import supabase from "./supabase";

/** Usernames are lowercase alphanumeric plus - and _, 3-24 chars. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
    return "Usernames must be 3-24 characters: letters, numbers, - or _";
  }
  return null;
}

/**
 * Supabase auth is email-keyed, so usernames map to a synthetic address on
 * the project's domain. The "user-" prefix guarantees no collision with any
 * real mailbox on mtgatool.com. These addresses are never emailed
 * ("Confirm email" must stay disabled in the Supabase auth settings).
 */
function usernameToEmail(username: string): string {
  return `user-${normalizeUsername(username)}@mtgatool.com`;
}

export async function cloudSignup(
  username: string,
  password: string
): Promise<void> {
  const name = normalizeUsername(username);
  const invalid = validateUsername(name);
  if (invalid) throw new Error(invalid);
  if (password.length < 8) {
    throw new Error("Passwords must contain at least 8 characters.");
  }

  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(name),
    password,
    options: {
      // Consumed by the handle_new_user trigger to fill profiles.username
      data: { username: name },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      throw new Error("That username is taken.");
    }
    throw new Error(error.message);
  }

  setLocalSetting("username", name);
}

export async function cloudLogin(
  username: string,
  password: string
): Promise<void> {
  const name = normalizeUsername(username);

  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(name),
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      throw new Error("Wrong username or password.");
    }
    throw new Error(error.message);
  }

  setLocalSetting("username", name);
}

export async function cloudLogout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * The persisted session, if any (works offline — it's read from
 * localStorage, no network round trip needed).
 */
export async function getCloudSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
