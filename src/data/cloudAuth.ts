/**
 * Username/password auth on Supabase, replacing the old ECDSA-keypair identity.
 *
 * Supabase auth is EMAIL-keyed (there is no username login), so we derive a
 * synthetic, email-safe login id from the username and never collect a real
 * address. The username the user types is kept as a pretty DISPLAY name (it may
 * contain accents/spaces); the login id is an ASCII fold of it used for the
 * synthetic email. e.g. "Manwë" -> display "Manwë", login id "manwe",
 * email "user-manwe@mtgatool.com". These addresses are never emailed
 * ("Confirm email" stays disabled; a DB trigger auto-confirms them).
 */

import setLocalSetting from "../utils/setLocalSetting";
import { clearEntitlement } from "./entitlement";
import supabase from "./supabase";

/** The pretty display name: trimmed, otherwise left as typed. */
export function normalizeDisplayName(username: string): string {
  return username.trim();
}

/**
 * Fold a display username into an ASCII, email-safe login id. NFKD splits
 * accented letters into base + combining mark; we drop the marks (ë -> e),
 * lowercase, then strip anything still not allowed in an email local-part.
 */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
// Built from a string so babel never tries to transpile the \p{...} unicode
// property escapes (the runtime — Chromium — supports them natively). Letters
// incl. accents + combining marks, digits, space, - and _.
const DISPLAY_NAME_CHARSET = new RegExp("^[\\p{L}\\p{M}0-9 _-]+$", "u");

export function usernameToLoginId(username: string): string {
  return username
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "");
}

export function validateUsername(username: string): string | null {
  const name = normalizeDisplayName(username);
  if (name.length < 3 || name.length > 24) {
    return "Usernames must be 3-24 characters.";
  }
  // Letters (including accented), numbers, spaces, - and _.
  if (!DISPLAY_NAME_CHARSET.test(name)) {
    return "Usernames can use letters, numbers, spaces, - and _.";
  }
  // Whatever they type must fold to at least a few usable characters, since the
  // login id is what actually identifies the account.
  if (usernameToLoginId(name).length < 3) {
    return "Please include at least 3 letters or numbers.";
  }
  return null;
}

/**
 * The synthetic address an account signs in with. Not a secret — anyone can
 * derive it from a username — which is what lets the password reset flow work
 * without the client ever learning the real recovery address.
 */
export function usernameToEmail(username: string): string {
  return `user-${usernameToLoginId(username)}@mtgatool.com`;
}

export async function cloudSignup(
  username: string,
  password: string
): Promise<void> {
  const name = normalizeDisplayName(username);
  const invalid = validateUsername(name);
  if (invalid) throw new Error(invalid);
  if (password.length < 8) {
    throw new Error("Passwords must contain at least 8 characters.");
  }

  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(name),
    password,
    options: {
      // login id fills profiles.username (unique, lowercase) via the
      // handle_new_user trigger; the pretty name is kept in user metadata.
      data: { username: usernameToLoginId(name), display_name: name },
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
  const name = normalizeDisplayName(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(name),
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      throw new Error("Wrong username or password.");
    }
    throw new Error(error.message);
  }

  // Prefer the stored pretty display name so that logging in with the folded
  // form ("manwe") still shows the original ("Manwë").
  const display =
    (data.user?.user_metadata?.display_name as string | undefined) || name;
  setLocalSetting("username", display);
}

export async function cloudUpdatePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Passwords must contain at least 8 characters.");
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function cloudLogout(): Promise<void> {
  // claimLocalStore handles an account *switch*; this covers signing out into
  // local mode, where the next session must not inherit the badge.
  await clearEntitlement();
  await supabase.auth.signOut();
}

/**
 * The persisted session, if any (works offline — it's read from localStorage,
 * no network round trip needed).
 */
export async function getCloudSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
